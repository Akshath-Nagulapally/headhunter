// Import the node-fetch module

//todo list for the edge functions: console.log the input query so that its easier to debug
//edge runtime
//store the api key in an env variable so that its secure n shit

import fetch, { Headers } from 'node-fetch';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 
export async function GET(request: any) {
    // Set up headers and request body as in your provided code
    const url = new URL(request.url);
    const query = url.searchParams.get("query"); // "q" is the name of the query parameter
  
    var myHeaders = new Headers();
    myHeaders.append("X-API-KEY", "2d360b77703f4c688f8d9c2b314040291a91043d");
    myHeaders.append("Content-Type", "application/json");
  
    var raw = JSON.stringify({
      "q": query
    });
  
      
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };
  
    // Make the fetch request and await its response
    try {

      const response = await fetch("https://google.serper.dev/search", requestOptions);
      const result: any = await response.json();
      console.log("this was the user query:", query);
      // Return the result as a server response

      if (result && result.organic) {
        // Transform the "organic" array elements
        const transformedOrganicResults = result.organic.map((item: any, index: any) => ({
          name: item.title,
          link: item.link,
          id: 12 // Static id as per the requirement
        }));
  
        return new Response(JSON.stringify(transformedOrganicResults), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // If the "organic" part is not found, return a meaningful error message
        return new Response('No organic results found', { status: 404 });
      }
      } catch (error) {
      // Handle errors
      console.log('error', error);
      return new Response('Error fetching data', { status: 500 });
    }
  }
  
export const runtime = 'nodejs';
