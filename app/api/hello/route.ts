// Import the node-fetch module

//todo list for the edge functions: console.log the input query so that its easier to debug
//edge runtime
//store the api key in an env variable so that its secure n shit

import fetch from 'node-fetch';

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
      redirect: 'follow'
    };
  
    // Make the fetch request and await its response
    try {
      const response = await fetch("https://google.serper.dev/search", requestOptions);
      const result = await response.text();
      // Return the result as a server response
      return new Response(result, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // Handle errors
      console.log('error', error);
      return new Response('Error fetching data', { status: 500 });
    }
  }
  
export const runtime = 'nodejs';
