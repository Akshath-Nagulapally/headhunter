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
import { messageRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { DataTable } from "./table/data-table";
import DemoPage from './table/RenderedTable';
import { Payment, columns } from "./table/columns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

//dorks = [];

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

  const ip = headers().get("x-real-ip") ?? "local";
  const rl = await messageRateLimit.limit(ip);

  if (!rl.success) {
    reply.done(
      <BotMessage>Rate limit exceeded. Try again in 15 minutes.</BotMessage>,
    );
    return {
      id: Date.now(),
      display: reply.value,
    };
  }

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
        Google dorking involves using advanced search operators like site:, intitle:, inurl:, "exact phrase", -exclude, * (wildcard), OR, AND , and + (force include), to refine and target specific search queries for detailed information retrieval.[END OF CONTEXT]

        [INSTRUCTIONS]
        Encapsulate your google dork in “#”

        I will provide you with a job description for a certain company and you will generate a google dork to find profiles that will be qualified for that job description.
        Make sure the company name is not included in any of the dorks. Make sure it is only from linkedin. Keep the dork fairly general.
        think about the following:
        
        1)Location(change this by changing the location's domain ie: site:ca.linkedin.com/in/ for linkedin canada, etc) or keep it broad through the .com
        2)Job title
        3)Show similar results(search?q=~+)
        4)Keywords to include, E.g. London OR Paris AND html
        5)Keywords to exclude
        6)Education
        7)Current Employer(optional, can be left blank)

        Use an OR clause between every keyword
        
        Output 1 dork, surround it with #. Outline your reasoning after you have outputted the dork(one line max). There is absolutely no reason why you should step through the description sequentially.
        END OF INSTRUCTIONS
                        
        [END OF INSTRUCTIONS]
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
//makke sure it is headhunter, not aiheadhunter
      fetch('https://headhunter.vercel.app/api/hello?query='+final_context)
        .then(response => response.json())
        .then(data => {

          console.log(data);
          reply.update(<BotMessage><DemoPage prospects_data={data}/> </BotMessage>);
          reply.done();
          aiState.done([...aiState.get(), { role: "user", content }]);
          console.log("First aistate log:", aiState.get());
          aiState.update([{ role: "user", content }]);
          console.log("Second AIstate log:", aiState.get());


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
    console.log(aiState.get());
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
