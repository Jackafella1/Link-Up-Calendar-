//import logo from './logo.svg';
import './App.css';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react'
import DateTimePicker from 'react-datetime-picker';
import { useState, useEffect } from 'react';

function App() {
  const [ start, setStart ] = useState(new Date());
  const [ end, setEnd ] = useState(new Date());
  const [ eventName, setEventName ] = useState("");
  const [ eventDescription, setEventDescription ] = useState("");
  const [ providerToken, setProviderToken ] = useState(null);

  const session = useSession(); // tokens, when session exists we have a user
  const supabase = useSupabaseClient(); // talk to supabase!
  const { isLoading } = useSessionContext(); // loading state

  useEffect(() => {
    console.log("Session:", session);
    if (session) {
      // Retrieve the provider token from the session
      const fetchProviderToken = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (data) {
          setProviderToken(data.user.provider_token);
        }
        if (error) {
          console.error("Error fetching provider token:", error);
        }
      };
      fetchProviderToken();
    }
  }, [session, supabase.auth]);

  if (isLoading) {
    return <></>
  }

  async function googleSignIn() {
    const {error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        scopes: 'https://www.googleapis.com/auth/calendar' 
      }
    });
    if(error){
      alert("Error logging in with Google provider with supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCalenderEvent() { 
    if (!session || !providerToken) {
      alert("You need to be logged in to create an event");
      return;
    }

    console.log("Creating event");
    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // get the timezone of the user
      },
      'end': {
        'dateTime': end.toISOString(), // end of the event
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // get the timezone of the user
      },
    }
    console.log("Event data:", event);
    console.log("Access token:", providerToken);

    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": 'Bearer ' + session.provider_token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    })
    .then((response) => {
      console.log("API response:", response);
      return response.json();
    })
    .then((data) => {
      console.log("API response data:", data);
      if (data.error) {
        console.error("Error creating event:", data.error);
        alert("Error creating event: " + data.error.message);
      } else {
        alert("Event created, check your google calendar");
      }
    })
    .catch((error) => {
      console.error("Error creating event:", error);
      alert("Error creating event");
    });
  }

  return (
    <div className="App">
      <div style={{width: "400px", margin: "30px auto"}}>
        {session ? 
        <>
        <h2> Hey there {session.user.email} </h2>
        <p>Start of your event</p>
        <DateTimePicker onChange={setStart} value={start} />
        <p>End of your event</p>
        <DateTimePicker onChange={setEnd} value={end} />
        <p>Event name</p>
        <input type="text" onChange={(e) => setEventName(e.target.value)} />
        <p>Event description</p>
        <input type="text" onChange={(e) => setEventDescription(e.target.value)} />
        <hr />
        <button onClick={() => createCalenderEvent()}>Create Calendar Event</button>
        <p></p>
        <button onClick={() => signOut()}>Sign Out</button>
        </>
        :
        <>
           <button onClick={() => googleSignIn()}>Sign In with Google</button>
        </>
        }
     </div>
    </div>
  );
}

export default App;