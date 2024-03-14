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

  
    var myHeaders = new Headers();
    myHeaders.append("Cache-Control", "no-cache");
    myHeaders.append("Content-Type", "application/json");
  
    var raw = JSON.stringify({
      "api_key": "FsuTukpMohaDvmMQFenczQ", // Use your actual API key here
      "linkedin_url": linkedinUrl // Use the LinkedIn URL obtained from query parameters
    });
  
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

  
    try {
      const response = await fetch("https://api.apollo.io/v1/people/match", requestOptions);
      const result = await response.json() as Result; // Type assertion here
      console.log(linkedinUrl);

      if (result && result.person) {
        // Assuming result contains the data you need to return
        const email = result.person.email; // Access the email of the person object

        return new Response(JSON.stringify({email: email}), {
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

