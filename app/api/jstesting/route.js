export const dynamic = 'force-dynamic'; // static by default, unless reading the request
 

// async function verify_email(name,places_worked){

//get the birthdays and stuff as well.
// }

function retrieveCandidateDetails(candidateData) {
    // Extract the full name
    const fullName = candidateData.full_name;
    
    // Get the work experience array
    const workExperience = candidateData.work_experience;
    
    // Filter out the current job if it is included in the data
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based
    let previousPositions = workExperience.filter(job => {
        // If job end date is not provided, consider the start date for filtering
        if (!job.date.end.year || (job.date.end.year === currentYear && !job.date.end.month)) {
            return job.date.start.year < currentYear || 
                   (job.date.start.year === currentYear && job.date.start.month < currentMonth);
        }
        return true; // Include jobs that have an end date
    });

    // Sort jobs by end date in descending order to get the latest jobs first
    previousPositions.sort((a, b) => {
        const endDateA = a.date.end.year || currentYear;
        const endDateB = b.date.end.year || currentYear;
        return endDateB - endDateA || ((b.date.end.month || currentMonth) - (a.date.end.month || currentMonth));
    });

    // Limit to the previous two positions
    previousPositions = previousPositions.slice(0, 2);

    // Extract the necessary details
    const positions = previousPositions.map(job => ({
        company: job.company.name,
        title: job.profile_positions[0].title,
        startYear: job.date.start.year,
        endYear: job.date.end.year || 'Present'
    }));

    return {
        fullName,
        positions
    };
}






export async function GET(request) {
    const request_url = new URL(request.url);
    const linkedinUrl = request_url.searchParams.get("linkedinurl"); // Extract LinkedIn URL from query parameters

    const url = "https://api.prospeo.io/linkedin-email-finder";
    const apiKey = "2a0cf33cb932c239d14953d24309ddc6";
    
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
        if (email) {
            return new Response(email); // Use JSON data in your response
        } else {
            // If email is null or not found
            return new Response(retrieveCandidateDetails(jsonData));
        }

    } catch (error) {
        console.error(error); // Log any errors to the console
        return new Response("email not found"); // Return an error response
    }
}
