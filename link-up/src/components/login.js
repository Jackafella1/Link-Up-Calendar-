// Import necessary hooks from Supabase auth helpers to manage user session and authentication
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react'
// Define the Login component, which handles user authentication via Google Sign-In
function Login() {
// Get the current user session (null if not logged in)
const session = useSession();
// Get the Supabase client to interact with the Supabase backend (e.g., for authentication)
const supabase = useSupabaseClient();
// get the session context to check if sessesion is still loading
const { isLoading } = useSessionContext();

// Function to handle Google Sign-in using Supabase's OAuth authentication.
aysync function googleSigIn() {
    // attempt to sign in with Google, requesting access to the user's Google Calandar
    const { error } = await supabase.auth.sigInWithOAuth({
        provider: 'google', //specify Google as OAuth provider
        options: {
          scopes: 'https://www.googleapis.co/auth/calendar', // request access to Google Calendar for event creation
        },

    });
    // if theres an error during sign-in, display an alert and the log the error
    if (error) {
        alert( 'Error logging in with Google provider with Supabase');
        console.log(error);
    }
    }
    // if the session is still loading, display a loading message to the to the user 
    if (isLoading) {
        return<div>Loading...</div>
    }

    //If the user is logged in (session exits), return null
    //The App.js will handle redirecting to the next page (GroupSetup or HomeScreen)
    if (session) {
        return null;
    }

    // If the user is already logged in (session exits), return null 
    // The App.js will handle redirecting to the next page (GroupSetup or HomeScreen)
    if (session) {
        return null;
    }

    //Render the login page UI when the user is not logged in 
    return (
        <div style={{ width: '400px', margin: '30px auto' }}>
        {/*Display the app title */}
        <h2>Link Up Calandar</h2>
        {/* Button to trigger Google Sign-in */}
        <button onClick={googleSignIn}>Sign In with Google</button>
        </div>
    );

}

//Export the Login component as default export
export default Login;