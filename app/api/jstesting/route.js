export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 
export async function GET(request) {
    const request_url = new URL(request.url);
    const linkedinUrl = request_url.searchParams.get("linkedinurl"); // Extract LinkedIn URL from query parameters

    const url = "https://api.prospeo.io/linkedin-email-finder";
    const apiKey = "2b183e6d26de2077fcb1744199f09d26";
    
    const requiredHeaders = {
        "Content-Type": "application/json",
        "X-KEY": apiKey
    };
    
    const data = {
        url: linkedinUrl
    };
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: requiredHeaders,
            body: JSON.stringify(data)
        });
        const jsonData = await response.json(); // Await the JSON parsing of the response body
        console.log(jsonData); // Log the JSON data to the console
        const email = jsonData.response.email.email;

        return new Response(email); // Use JSON data in your response
    } catch (error) {
        console.error(error); // Log any errors to the console
        return new Response("email not found"); // Return an error response
    }
}
