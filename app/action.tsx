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


async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },
    {
      id: "728ed52f",
      name: "pending",
      link: "m@example.com",
    },

  ]
}




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
  
    // Return the first match or undefined if no matches are found
    return matches.length > 0 ? matches[0] : undefined;
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
  

  async function prospect(llmMessage: string) {
    const baseUrl = "https://3888-139-167-50-142.ngrok-free.app/prospect?query=";
    const url = `${baseUrl}${encodeURIComponent(extractHashtagText(llmMessage) || "")}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const array_of_prospects = await response.json(); // Assuming the output is text. Use .json() if the output is JSON.
      console.log(array_of_prospects);
      return array_of_prospects;

    } catch (error) {
      return [
        {
          link:"Try to ask something more specific",
          name:"no available data",
          id:"not found",
        }
      ]
      console.error("Error fetching data: ", error);
    }
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
        role: "system",
        content: `INSTRUCTIONS:

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

Output 1 dork, surround it with #. Outline your reasoning before you output the dork(one line max). There is absolutely no reason why you should step through the description sequentially. I dont want it to be the case where there there could be no results, so make your queries relatively broad.
END OF INSTRUCTIONS`,

// `\
// You are a stock trading conversation bot and you can help users buy stocks, step by step.
// You can let the user throw confetti, as many times as they want, to celebrate.
// You and the user can discuss stock prices and the user can asdjust the amount of stocks they want to buy, or place an order, in the UI.

// Messages inside [] means that it's a UI element or a user event. For example:
// - "[Price of AAPL = 100]" means that an interface of the stock price of AAPL is shown to the user.
// - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.

// If the user requests playing pacman, call \`play_pacman\` to play pacman.
// If the user requests throwing confetti, call \`throw_confetti\` to throw confetti.
// If the user requests purchasing a stock, call \`show_stock_purchase_ui\` to show the purchase UI.
// If the user just wants the price, call \`show_stock_price\` to show the price.
// If you want to show trending stocks, call \`list_stocks\`.
// If you want to show events, call \`get_events\`.
// If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.

// Besides that, you can also chat with users and do some calculations if needed.
// `,
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: [
      {
        name: "play_pacman",
        description: "Play pacman with the user.",
        parameters: z.object({}),
      },
      {
        name: "throw_confetti",
        description: "Throw confetti to the user. Use this to celebrate.",
        parameters: z.object({}),
      },
      {
        name: "show_stock_price",
        description:
          "Get the current stock price of a given stock or currency. Use this to show the price to the user.",
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              "The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.",
            ),
          price: z.number().describe("The price of the stock."),
          delta: z.number().describe("The change in price of the stock"),
        }),
      },
      {
        name: "show_stock_purchase_ui",
        description:
          "Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.",
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              "The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.",
            ),
          price: z.number().describe("The price of the stock."),
          numberOfShares: z
            .number()
            .describe(
              "The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.",
            ),
        }),
      },
      {
        name: "list_stocks",
        description: "List three imaginary stocks that are trending.",
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe("The symbol of the stock"),
              price: z.number().describe("The price of the stock"),
              delta: z.number().describe("The change in price of the stock"),
            }),
          ),
        }),
      },
      {
        name: "get_events",
        description:
          "List funny imaginary events between user highlighted dates that describe stock activity.",
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe("The date of the event, in ISO-8601 format"),
              headline: z.string().describe("The headline of the event"),
              description: z.string().describe("The description of the event"),
            }),
          ),
        }),
      },
    ],
    temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {

    reply.update(<BotMessage>{removeDorkText(content)}</BotMessage>);
    if (isFinal) {

      const final_context = extractHashtagText(content)
      console.log("final_user_message:",final_context)

      fetch('https://headhunter.vercel.app/api/hello?query='+final_context)
        .then(response => response.json())
        .then(data => {
          console.log(data);
          reply.update(<BotMessage><DemoPage prospects_data={data}/> </BotMessage>);
          reply.done();
          aiState.done([...aiState.get(), { role: "assistant", content }]);

        }).catch(error => console.error('Error:', error));


      // prospect(content).then(array_of_prospects => {
      //   console.log(array_of_prospects); // Handle the data here
      //   reply.update(<BotMessage>{extractHashtagText(content)} <DemoPage prospects_data={array_of_prospects}/> </BotMessage>);
      //   reply.done();
      //   aiState.done([...aiState.get(), { role: "assistant", content }]);
  
      // }).catch(error => {
      //   console.error(error); // Handle any errors here
      // });
      


    }
  });

  completion.onFunctionCall("list_stocks", async ({ stocks }) => {
    reply.update(
      <BotCard>
        <StocksSkeleton />
      </BotCard>,
    );

    await sleep(1000);

    reply.done(
      <BotCard>
        <Stocks stocks={stocks} />
      </BotCard>,
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "list_stocks",
        content: JSON.stringify(stocks),
      },
    ]);
  });

  completion.onFunctionCall("get_events", async ({ events }) => {
    reply.update(
      <BotCard>
        <EventsSkeleton />
      </BotCard>,
    );

    await sleep(1000);

    reply.done(
      <BotCard>
        <Events events={events} />
      </BotCard>,
    );

    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "list_stocks",
        content: JSON.stringify(events),
      },
    ]);
  });

  completion.onFunctionCall("play_pacman", () => {
    reply.done(
      <BotMessage>
        <Pacman />
      </BotMessage>,
    );
    aiState.done([
      ...aiState.get(),
      {
        role: "function",
        name: "play_pacman",
        content: `[User has requested to play pacman]`,
      },
    ]);
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

  completion.onFunctionCall(
    "show_stock_price",
    async ({ symbol, price, delta }) => {
      reply.update(
        <BotCard>
          <StockSkeleton />
        </BotCard>,
      );

      await sleep(1000);

      reply.done(
        <BotCard>
          <Stock name={symbol} price={price} delta={delta} />
        </BotCard>,
      );

      aiState.done([
        ...aiState.get(),
        {
          role: "function",
          name: "show_stock_price",
          content: `[Price of ${symbol} = ${price}]`,
        },
      ]);
    },
  );

  completion.onFunctionCall(
    "show_stock_purchase_ui",
    ({ symbol, price, numberOfShares = 100 }) => {
      if (numberOfShares <= 0 || numberOfShares > 1000) {
        reply.done(<BotMessage>Invalid amount</BotMessage>);
        aiState.done([
          ...aiState.get(),
          {
            role: "function",
            name: "show_stock_purchase_ui",
            content: `[Invalid amount]`,
          },
        ]);
        return;
      }

      reply.done(
        <>
          <BotMessage>
            Sure!{" "}
            {typeof numberOfShares === "number"
              ? `Click the button below to purchase ${numberOfShares} shares of $${symbol}:`
              : `How many $${symbol} would you like to purchase?`}
          </BotMessage>
          <BotCard showAvatar={false}>
            <Purchase
              defaultAmount={numberOfShares}
              name={symbol}
              price={+price}
            />
          </BotCard>
        </>,
      );
      aiState.done([
        ...aiState.get(),
        {
          role: "function",
          name: "show_stock_purchase_ui",
          content: `[UI for purchasing ${numberOfShares} shares of ${symbol}. Current price = ${price}, total cost = ${
            numberOfShares * price
          }]`,
        },
      ]);
    },
  );

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
