import './App.css';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { useState, useEffect } from 'react';

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [providerToken, setProviderToken] = useState(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  useEffect(() => {
    console.log('Session:', session);
    if (session) {
      setIsTokenLoading(true);
      const fetchProviderToken = async (retryCount = 0, maxRetries = 3) => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error fetching session:', error);
            return;
          }
          if (data.session?.provider_token) {
            setProviderToken(data.session.provider_token);
            console.log('Provider token set:', data.session.provider_token);
          } else if (retryCount < maxRetries) {
            console.warn('No provider token found, retrying...', { retryCount });
            setTimeout(() => fetchProviderToken(retryCount + 1, maxRetries), 1000);
          } else {
            console.error('No provider token found in session after retries');
            setProviderToken(null);
            alert('Failed to retrieve Google Calendar token. Ensure browser extensions are disabled and try again.');
          }
        } catch (error) {
          console.error('Unexpected error fetching provider token:', error);
        } finally {
          setIsTokenLoading(false);
        }
      };
      fetchProviderToken();
    } else {
      setProviderToken(null);
      setIsTokenLoading(false);
    }
  }, [session, supabase]);

  if (isLoading) {
    return <></>;
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      alert('Error logging in with Google. Disable browser extensions (e.g., uBlock Origin, ClearURLs) and try again.');
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProviderToken() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      return data.session?.provider_token || null;
    } catch (error) {
      console.error('Unexpected error refreshing session:', error);
      return null;
    }
  }

  async function createCalendarEvent() {
    if (!session) {
      alert('You need to be logged in to create an event');
      console.log('Session:', session);
      return;
    }

    console.log('Checking providerToken state:', providerToken);
    let token = providerToken;
    if (!token) {
      console.log('No provider token in state, attempting to fetch...');
      token = await refreshProviderToken();
      if (!token) {
        alert('Failed to retrieve Google Calendar access token. Ensure browser extensions are disabled.');
        console.log('Provider Token:', token);
        return;
      }
      setProviderToken(token);
    }

    console.log('Creating event');
    const event = {
      summary: eventName,
      description: eventDescription,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    console.log('Event data:', event);
    console.log('Access token:', token);

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      const data = await response.json();
      console.log('API response data:', data);

      if (data.error) {
        console.error('Error creating event:', data.error);
        alert(`Error creating event: ${data.error.message}`);
      } else {
        alert('Event created, check your Google Calendar!');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event: Network or API issue. Disable browser extensions and try again.');
    }
  }

  return (
    <div className="App">
      <div style={{ width: '400px', margin: '30px auto' }}>
        {session ? (
          <>
            <h2>Hey there {session.user.email}</h2>
            <p>Start of your event</p>
            <DateTimePicker onChange={setStart} value={start} />
            <p>End of your event</p>
            <DateTimePicker onChange={setEnd} value={end} />
            <p>Event name</p>
            <input type="text" onChange={(e) => setEventName(e.target.value)} />
            <p>Event description</p>
            <input type="text" onChange={(e) => setEventDescription(e.target.value)} />
            <hr />
            <button onClick={() => createCalendarEvent()} disabled={isTokenLoading}>
              {isTokenLoading ? 'Loading...' : 'Create Calendar Event'}
            </button>
            <p></p>
            <button onClick={() => signOut()}>Sign Out</button>
          </>
        ) : (
          <button onClick={() => googleSignIn()}>Sign In with Google</button>
        )}
      </div>
    </div>
  );
}

export default App;