import "server-only";
import { createAI, createStreamableUI, getMutableAIState } from "ai/rsc";
import OpenAI from "openai";

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase,
  Stocks,
  Events,
} from "@/components/llm-stocks";
import { Pacman } from "@/components/pacman";
import { Confetti } from "@/components/confetti";

import {
  runAsyncFnWithoutBlocking,
  sleep,
  formatNumber,
  runOpenAICompletion,
} from "@/lib/utils";
import { z } from "zod";
import { StockSkeleton } from "@/components/llm-stocks/stock-skeleton";
import { EventsSkeleton } from "@/components/llm-stocks/events-skeleton";
import { StocksSkeleton } from "@/components/llm-stocks/stocks-skeleton";

import { messageRateLimitPaying } from "@/lib/rate-limit";
import {messageRateLimitNoLogin} from "@/lib/rate-limit";
import {messageRateLimit_Login_NotPaying} from "@/lib/rate-limit";
import { DataTable } from "./table/data-table";
import DemoPage from './table/RenderedTable';
import { Payment, columns } from "./table/columns";
import React, { useContext } from 'react';
import {useCounterStore} from './store';
import { getState } from './store';
import { headers } from 'next/headers';


//Todo: Basically create another url kinda thing called paying
//handle it good for null state.
//if set to true then whatever
//If set to false then rate limit it after 3 more free queries.
//Additionally add that thing for "oops seems like you subscribed for two free trials which is not allowed. Please contact: akshath@goark.ai while your account is on standby for suspicious activity"
//Additionally, half the number of serper api calls you make, num results should be 50.













const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});


function get_url() {
  const headersList = headers();
  const domain = headersList.get('host') || "";
  const fullUrl = headersList.get('referer') || "";

  console.log(fullUrl);

  return fullUrl;
}

function get_and_parse_url() {
  // Call get_url to retrieve the full URL
  const fullUrl = get_url();

  // Use a regular expression to extract the last non-empty segment after a slash
  const match = fullUrl.match(/\/([^\/]+)\/?$/);

  // Check if a valid segment was found and it is not the string "null"
  if (match && match[1] && match[1].toLowerCase() !== "null") {
    console.log("userid found", match[1]);
    return match[1];
  }
  return null;
}




async function getUserDetails(id_user: string) {

  try {
    const response = await fetch(`http://localhost:3000/api/user_details?u_id=${id_user}`);
    const data = await response.text(); // This parses the JSON body of the response
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.log(error)
    console.error('Error:', error);
  }
}




async function submitUserMessage(content: string) {
  "use server";

  function extractHashtagText(text: string) {
    // Regular expression to match text surrounded by hashtags
    const regex = /#([^#]+)#/g;
    const matches = [];
    let match;
  
    // Loop over all matches and push them to the matches array
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
  
    // Return the first match or none if no matches are found
    return matches.length > 0 ? matches[0] : "null";
  }

  // function createPrompt(text: string) {
  //   // Create a string from the dorks array, separating each element with ", "
  //   const dorksString = dorks.join(", ");
  
  //   // Concatenate the dorksString with the input text
  //   // You can adjust the transition sentence as needed
  //   const transition = "Here was the gradual progression of dorks that you generated: " + dorksString + ". And here is my next request: " + text;
  
  //   return transition;
  // }
  
  function processHashtagsAndRemovePhrases(text: string) {
    // Remove specified phrases
    text = text.replace(/google dork|dork/gi, '');
  
    // Count the number of hashtags in the text
    const hashtagCount = (text.match(/#/g) || []).length;
    
    if (hashtagCount === 0) {
      // Delete everything from the hashtag to the end
      return text;
    }

    // If there is exactly one hashtag
    if (hashtagCount === 1) {
      // Delete everything from the hashtag to the end
      return text.split('#')[0];
    }

    // If there are exactly two hashtags
    if (hashtagCount === 2) {
      // Use a regular expression to remove the text between the two hashtags, including the hashtags
      return text.replace(/#.*?#/g, '');
    }
    
    // Return the processed text if there are not exactly one or two hashtags
    return text;
  }
    

  function removeDorkText(text: string) {
    // Step 1: Remove all instances of the word "dork" (case-insensitive)
    text = text.replace(/dork/gi, '');
  
    // Regular expression to match hashtags and text between them
    const regex = /#([^#]*)/g;
    let matches: string[] = []; // Explicitly declare as an array of strings
    let match;
    
    // Loop over all matches and push them to the matches array
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0]);
    }
  
    // Determine action based on the number of hashtags
    if (matches.length === 1) {
      // If there is one hashtag, remove the text after it
      text = text.replace(new RegExp(matches[0] + '.*'), '');
    } else if (matches.length > 1) {
      if (matches.length % 2 === 0) {
        // If there are an even number of hashtags, remove text between each pair of hashtags
        matches.forEach((match, index) => {
          if (index % 2 === 0) {
            let endMatch = matches[index + 1] ? matches[index + 1] : '';
            let pattern = match + '[^#]*' + endMatch;
            text = text.replace(new RegExp(pattern, 'g'), '');
          }
        });
      } else {
        // If there is an odd number of hashtags greater than one, remove text between hashtags
        // and also remove text after the final hashtag
        matches.forEach((match, index) => {
          if (index % 2 === 0) {
            let endMatch = matches[index + 1] ? matches[index + 1] : '';
            let pattern = match + '[^#]*' + endMatch;
            text = text.replace(new RegExp(pattern, 'g'), '');
          }
        });
        // Remove the text after the final hashtag
        text = text.replace(new RegExp(matches[matches.length - 1] + '.*'), '');
      }
    }
  
    return text;
  }
  

//////////////////////////////////////////////////////////////////////////
  const reply = createStreamableUI(
    <BotMessage className="items-center">{spinner}</BotMessage>,
  );

  // const user_id = getUserId();  // This will get the current userid
  // console.log("userid found from action.tsx", user_id);
  
  // //const user_id = '1234';
  //const user_id = 
  //console.log("zustand action", user_id);
  //const user_login = await getUserDetails(user_id);
  //console.log(user_login);

  const ip = headers().get("x-real-ip") ?? "local";
  const user_identity_token = get_and_parse_url();

  //if (!user){} logic here starts, this is where we rate limit the unsubscribed/let the subscribed pass
  
  if (user_identity_token === null) {
    console.log('is null');
    const rl = await messageRateLimitNoLogin.limit(ip);

    if (!rl.success) {
      console.log("IP address:", ip);
      reply.done(
        <BotMessage>Maximum number of anonymous requests has been reached. Sign up/in to receive 3 more free requests</BotMessage>,
      );
      return {
        id: Date.now(),
        display: reply.value,
      };
    }


  } else {

    const user_payment_status = await getUserDetails(user_identity_token);

    if(user_payment_status === "user is paying"){
      const rl = await messageRateLimitPaying.limit(ip);

      if (!rl.success) {
        console.log(ip);
        reply.done(
          <BotMessage>Maximum requests reached. Please try again in 15 minutes</BotMessage>,
        );
        return {
          id: Date.now(),
          display: reply.value,
        };
      }
    }else{

    const rl = await messageRateLimit_Login_NotPaying.limit(ip);

    //do a database check to make sure that noone found the url and is scamming you by using a fake user identity.
    //BETTER SOLUTION : Simply remove page.tsx that is not in the [userid] folder. This way you can only access it through a certain way and that way is route/ip protected

    if (!rl.success) {
      console.log(ip);
      reply.done(
        <BotMessage>Your free credits have exhausted, please subscribe to continue.</BotMessage>,
      );
      return {
        id: Date.now(),
        display: reply.value,
      };
    }
  }
}
  
  


  //if (!user){} logic here ends
  
  //else user logic here starts.

  //basically if a user has an account then it is here. One nice thing about this is that i can just set the rate limit based on his usage.
  // I dont have to store any of these in a database, i just do it through vercel kv rate limiting based on the tier that they are in.

  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content,
    },
  ]);


  const completion = runOpenAICompletion(openai, {
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "system",
        content: `
        [CONTEXT]
        Google dorking involves using advanced search operators like site:, intitle:, inurl:, "exact phrase", -exclude, * (wildcard), OR, AND , and + (force include), to refine and target specific search queries for detailed information retrieval.
        [/CONTEXT]
        [INSTRUCTIONS]
        Encapsulate your google dork in “#”

        I will provide you with a job description for a certain company and you will generate a google dork to find profiles that will be qualified for that job description.
        Make sure the company name is not included in any of the dorks. Make sure it is only from linkedin. Keep the dork fairly general and as the user gives you feedback, make the desicion to be more specific of general.
        
        Think about the following:
        
        1)Location(change this by changing the location's domain ie: site:ca.linkedin.com/in/ for linkedin canada, etc) or keep it broad through the .com
        2)Job title
        3)Show similar results(search?q=~+)
        4)Keywords to include, E.g. London OR Paris AND html
        5)Keywords to exclude
        6)Education
        7)Current Employer(optional, can be left blank)

        Make sure you are using OR and AND to broaden/narrow the scope of your search.
        
        Outline your reasoning(one line max).
        When the user gives you feedback, make that your first priority.

        [/INSTRUCTIONS]
                        
                `
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: [
      {
        name: "throw_confetti",
        description: "Throw confetti to the user. Use this to celebrate.",
        parameters: z.object({}),
      },
    ],
    temperature: 0.5,
  });
  

  completion.onTextContent((content: string, isFinal: boolean) => {

    reply.update(<BotMessage>{processHashtagsAndRemovePhrases(content)}</BotMessage>);
    if (isFinal) {
      //console.log(createPrompt(content));
      const final_context = extractHashtagText(content);
      console.log("adding this dork to the user context:",final_context);
      //dorks.push(final_context);
      //console.log("the user context has been updated to this", dorks);
      //https://headhunter.vercel.app
      const headersList = headers();
      const root_url = headersList.get('host');
//make sure it is headhunter, not aiheadhunter
      fetch('https://headhunter.vercel.app/api/hello?query='+final_context)
        .then(response => response.json())
        .then(data => {

          //console.log(data);
          reply.update(<BotMessage><p>{processHashtagsAndRemovePhrases(content)}</p><DemoPage prospects_data={data}/> </BotMessage>);
          reply.done();
          aiState.done([...aiState.get(), { role: "user", content }]);
          //console.log("First aistate log:", aiState.get());
          aiState.update([{ role: "user", content }]);
          //console.log("Second AIstate log:", aiState.get());


        }).catch(error => console.error('Error:', error));

    }


  });



  completion.onFunctionCall("throw_confetti", () => {
    reply.done(
      <BotMessage>
        <Confetti />
      </BotMessage>,
    );
    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "throw_confetti",
        content: `[User has requested to throw confetti]`,
      },
    ]);
    //console.log(aiState.get());
  });


  return {
    id: Date.now(),
    display: reply.value,
  };
}

// Define necessary types and create the AI.

const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialUIState,
  initialAIState,
});
