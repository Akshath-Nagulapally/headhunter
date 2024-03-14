import fetch, { Headers } from 'node-fetch';

interface Result {
  person?: {
    email: string;
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: any) {
    const url = new URL(request.url);
    const linkedinUrl = url.searchParams.get("linkedinurl"); // Extract LinkedIn URL from query parameters
    console.log(linkedinUrl);
  
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-KEY", "f43872dce30185b2a0b1e8ee30ed178d");

  
    var raw = JSON.stringify({
      "url": linkedinUrl // Use the LinkedIn URL obtained from query parameters
    });
  
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };
  
    try {
      const response = await fetch("https://api.apollo.io/v1/people/match", requestOptions);
      const result = await response.json() as Result; // Type assertion here
          
      if (result) {
        // Assuming result contains the data you need to return

        console.log(result);

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response('No results found', { status: 404 });
      }
    } catch (error) {
      console.log('error', error);
      return new Response('Error fetching data', { status: 500 });
    }
}

export const runtime = 'nodejs';

