import logo from './logo.svg';
import './App.css';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

function App() {
  const session = useSession(); // tokens, when session exists we have a user
  const supabase = useSupabaseClient(); // tak to supabase!

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

  console.log(session);

  return (
    <div className="App">
      <div style={{width: "400px", margin: "30px auto"}}>
        {session ? 
        <>
        <h2> Hey there {session.user.email} </h2>
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
