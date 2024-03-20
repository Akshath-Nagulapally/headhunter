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





async function confirmPurchase(symbol: string, price: number, amount: number) {
  
  "use server";
    

  const aiState = getMutableAIState<typeof AI>();

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>,
  );

  const systemMessage = createStreamableUI(null);

  runAsyncFnWithoutBlocking(async () => {
    // You can update the UI at any point.
    await sleep(1000);

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>,
    );

    await sleep(1000);

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{" "}
          {formatNumber(amount * price)}
        </p>
      </div>,
    );

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={" "}
        {formatNumber(amount * price)}.
      </SystemMessage>,
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "system",
        content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
          amount * price
        }]`,
      },
    ]);
  });

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: Date.now(),
      display: systemMessage.value,
    },
  };
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
        role: "user",
        content: `
        The goal is to find linkedin profiles of individuals who meet the job criteria. Generate a Google dork that finds the most relevant professionals. 
        Focus on identifying unique skills and qualifications mentioned in the job description, 
        Use advanced search operators to refine and broaden the results effectively.
        Make clear and concise arguments for why you are including anything before you land on your final dork. Encase your dork within hashtags
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
    temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {

    reply.update(<BotMessage>{processHashtagsAndRemovePhrases(content)}</BotMessage>);
    if (isFinal) {

      const final_context = extractHashtagText(content)
      console.log("final_user_message:",final_context)

      fetch('https://headhunter.vercel.app/api/hello?query='+final_context)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          reply.update(<BotMessage><DemoPage prospects_data={data}/> </BotMessage>);
          reply.done();
          aiState.done([...aiState.get(), { role: "user", content }]);

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
    confirmPurchase,
  },
  initialUIState,
  initialAIState,
});
