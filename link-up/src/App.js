// Import React hooks for managing state and side effects
import { useState, useEffect } from 'react';
// Import Supabase hooks to manage user session and interact with the Supabase backend
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
// Import the page components for different app states
import Login from './components/login.js';
import GroupSetup from './components/groupSetup.js';
import HomeScreen from './components/homeScreen.js';
// Import the CSS file for styling the app
import './App.css';

// Define the main App component, which manages the overall app flow
function App() {
 
  // State to track if the user is in a group
  const [isInGroup, setIsInGroup] = useState(false);
  // State to track if the group membership check is still loading
  const [loadingGroupCheck, setLoadingGroupCheck] = useState(true);

  // Get the current user session (null if not logged in)
  const session = useSession();
  // Get the Supabase client to interact with the Supabase backend (e.g., for database operations)
  const supabase = useSupabaseClient();
  // Get the session context to check if the session is still loading
  const { isLoading } = useSessionContext();

  console.log('isLoading:', isLoading); // Add this line
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL); // Add this line
  console.log('Supabase Anon Key:', process.env.REACT_APP_SUPABASE_ANON_KEY); // Add this line


// Function to add the user to the 'users' table in the database if they don't already exist
const addUserToDatabase = async () => {
  if (!session) return; // Exit if no session
  // Check if the user already exists in the 'users' table by their email
  const { data: existingUser, error: fetchError } = await supabase
    .from('users') 
    .select('*') 
    .eq('email', session.user.email)
    .single();

  // If there's an error fetching the user (other than "not found"), log the error 
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking user:', fetchError);
    return;
  }
  // If the user doesn't exist, insert them into the 'users' table 
  if (!existingUser) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: session.user.id,
        name: session.user.user_metadata.full_name || session.user.email.split('@')[0], // Use full name if available, otherwise derive from email
        email: session.user.email, // User's email
      });

    // If there's an error inserting the user, log the error  
    if (insertError) {
      console.error('Error adding user to database:', insertError);
    }
  }
};

// Function to check if the user is already in a group
const checkGroupMembership = async () => {
  if (!session) return; // Exit if no session
  // Query the 'groups' table to see if the user is in any group
  const { data, error } = await supabase
    .from('groups')
    .select('user_group_id')
    .eq('user_id', session.user.id);

  // If there's an error checking group membership, log the error and stop loading
  if (error) {
    console.error('Error checking group membership:', error);
    setLoadingGroupCheck(false);
    return;
  }  

  // Set the isInGroup state based on whether the user is in a group
  setIsInGroup(data.length > 0);
  // Stop loading group check
  setLoadingGroupCheck(false);
};  
  // useEffect hook to run logic when the session changes (e.g., user logs in)
  useEffect(() => {
    console.log('useEffect triggered, session:', session);
  // Only proceed if the user is logged in (session exists)
  if (session) {
    // Function to add the user to the 'users' table in the database if they don't already exist
    const addUserToDatabase = async () => {
   // Check if the user already exists in the 'users' table by their email
   const {data: existingUser, error: fetchError} = await supabase
     .from('users') 
     .select('*') 
     .eq('email', session.user.email)
     .single();

  // If there's an error fetching the user (other than "not found"), log the error 
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking user:', fetchError);
    return;
  }
  // If the user doesn't exist, insert them into the 'users' table 
  if (!existingUser) {
    const { error: insertError} = await supabase
      .from('users')
      .insert({
        user_id: session.user.id,
        name: session.user.user_metadata.full_name || session.user.email.split('@')[0],// Use full name if available, otherwise derive from email
        email: session.user.email, // User's email
      });

  // If there's an error inserting the user, log the error  
  if (insertError) {
    console.error('Error adding user to database:', insertError);
  }
  }
  };
  
  // Function to check if the user is already in a group
  const checkGroupMembership = async () => {
  // Query the 'groups' table to see if the user is in any group
  const { data, error} = await supabase
    .from('groups')
    .select('user_group_id')
    .eq('user_id', session.user.id);

  // If there's an error checking group membership, log the error and stop loading
  if (error) {
    console.error('Error checking group membership:', error);
    setLoadingGroupCheck(false);
    return;
  }  

  // Set the isInGroup state based on whether the user is in a group
  setIsInGroup(data.length > 0);
  // Stop loading group check
  setLoadingGroupCheck(false);
  };

  // Call the functions to add the user to the database and check group membership
  addUserToDatabase();
  checkGroupMembership();
}
// Add robust session handling and auth listener using inner functions
const handleAuthState = () => {
  try {
    // Explicitly fetch session as a fallback (though useSession should handle this)
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('No active session or auth error:', error.message);
        // Proceed without session if using anonymous access
      }
    });

    // Define inner functions for the listener scope
    const listenerAddUserToDatabase = async () => {
      if (session) {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking user:', fetchError);
          return;
        }
        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              user_id: session.user.id,
              name: session.user.user_metadata.full_name || session.user.email.split('@')[0],
              email: session.user.email,
            });
          if (insertError) {
            console.error('Error adding user to database:', insertError);
          }
        }
      }
    };

    const listenerCheckGroupMembership = async () => {
      if (session) {
        const { data, error } = await supabase
          .from('groups')
          .select('user_group_id')
          .eq('user_id', session.user.id);
        if (error) {
          console.error('Error checking group membership:', error);
          setLoadingGroupCheck(false);
          return;
        }
        setIsInGroup(data.length > 0);
        setLoadingGroupCheck(false);
      }
    };

    // Set up auth state listener to trigger actions when session changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (session) {
        listenerAddUserToDatabase();
        listenerCheckGroupMembership();
      } else {
        setIsInGroup(false); // Reset group state if logged out
        setLoadingGroupCheck(false);
      }
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  } catch (err) {
    console.error('Unexpected error in auth handling:', err);
  }
};

// Run auth handling if not loading and session is null or changed
if (!isLoading && (!session || session)) {
  handleAuthState();
}


  }, [session, supabase, isLoading]); // Run this effect when the session or supabase client changes

  // If the session is still loading, return an empty fragment (same as original behavior)
  if (isLoading) {
    return <></>;
  }

  // If the group membership check is still loading, display a loading message
  if (loadingGroupCheck) {
    return <div>Loading...</div>;
  }

  // If the user is not logged in (no session), render the Login component
  if (!session) {
    return <Login key={Date.now()} />;
  }
  // If the user is logged in but not in a group, render the GroupSetup component
  if (!isInGroup) {
    return <GroupSetup onGroupJoined={() => setIsInGroup(true)} />;
  }

  // If the user is logged in and in a group, render the HomeScreen component
  return <HomeScreen setIsInGroup={setIsInGroup} />;
}
// Export the App component as the default export
export default App;

    


  