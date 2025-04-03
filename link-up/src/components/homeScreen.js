// Import React hooks for managing state and side effects
import { useState, useEffect } from "react";
// Import Supabase hooks to manage user session and interact with the Supabase backend
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
// Import the DateTimePicker component for selecting event dates
import DateTimePicker from 'react-datetime-picker';

// Define the HomeScreen component, which displays the main app interface for users in a group
function HomeScreen ({ setIsInGroup}) {
  // Get the current user session
  const session = useSession();
  // Get the Supabase client to interact with the Supabase backend
  const supabase = useSupabaseClient();
  // State for the group name
  const [groupName, setGroupName] = useState('');
  // State for event start and end times
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  // State for event name and description
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  // State for suggesting a new activity
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityLink, setNewActivityLink] = useState('');
  const [newActivityDate, setNewActivityDate] = useState(new Date());
  const [newActivityLocation, setNewActivityLocation] = useState('');
  // State for inviting a user
  const [inviteeEmail, setInviteeEmail] = useState('');
  // State for storing suggested and accepted activities
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [acceptedActivities, setAcceptedActivities] = useState([]);
  // State for storing pending invitations
  const [invitations, setInvitations] = useState([]);
  // State for the Google provider token (used for calendar events)
  const [providerToken, setProviderToken] = useState(null);

  // useEffect hook to fetch initial data when the component mounts or session changes
  useEffect(() => {
    // Function to fetch the Google provider token for calendar access
    console.log("Session:", session);
    if (session) {
      const fetchProviderToken = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (data) {
          setProviderToken(data.user.provider_token);
        }
        if (error) {
          console.error('Error fetching provider token:', error);
        }  
      };
      fetchProviderToken();
    }
    // Function to fetch the user's group name
    const fetchGroupName = async () => {
      const { data, error} = await supabase
        .from('groups')
        .select('group_name')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching group name:', error);
        return;
      }
      setGroupName(data.group_name);
    };

    // Function to fetch suggested and accepted activities
    const fetchActivities = async () => {
      const { data: group, error: groupError} = await supabase
        .from('groups')
        .select('user_group_id')
        .eq('user_id', session.user.id)
        .single();

      if (groupError || !group) return;

      const { data: suggested, error: suggestedError } = await supabase
        .from('activities')
        .select('activity_id, name, activity_link, activity_date, activity_location')
        .eq('activity_owner_id', session.user.id);

      if (suggestedError) {
        console.error('Error fetching suggested activities:', suggestedError);
        return;
      }
      setSuggestedActivities(suggested);

      const { data: accepted, error: acceptedError} = await supabase
        .from('invitations')
        .select('activities (activity_id, name, activity_link, activity_date, activity_location)')
        .eq('user_id', session.user.id)
        .eq('accept', true);

      if(acceptedError) {
        console.error('Error fetching accepted activities:', acceptedError);
        return;
      }
      setAcceptedActivities(accepted.map((inv) => inv.activities));
    };
    // Function to fetch pending invitations
    const fetchInvitations = async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('invitation_id, activity_id, accept, decline')
        .eq('user_id', session.user.id)
        .eq('accept', false)
        .eq('decline', false);

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }
      setInvitations(data);
    };

    // Call the functions to fetch initial data
    fetchGroupName();
    fetchActivities();
    fetchInvitations();
  }, [session, supabase]); // Fetch initial data when session or supabase client changes

  // Function to create a Google Calendar event
  async function createCalendarEvent() {
    if (!session || !providerToken) {
      alert('You need to be logged in to create an event');
      return;
    }

    console.log("Creating event");
    const event = {
      'summary': eventName,
      'description': eventDescription, 
      'start': {
        'dateTime': start.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': end.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
    };
    console.log("Event data:", event);
    console.log("Access token:", providerToken);

    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": 'Bearer ' + providerToken,
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
        alert("Error creating event:" + data.error.message);
      } else {
        alert("Event created, check your Google calendar");
      }
    })
    .catch((error) => {
      console.error("Error creating event:", error);
      alert("Error creating event");
    });
  }

  // Function to suggest a new activity
  const suggestActivity = async () => {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('user_group_id')
      .eq('user_id', session.user.id)
      .single();

    if (groupError || !group) {
      alert('You must be in a group to suggest an activity');
      return;
    }

    const { error } = await supabase
      .from('activities')
      .insert({
        activity_owner_id: session.user.id,
        name: newActivityName,
        activity_link: newActivityLink,
        activity_date: newActivityDate.toISOString(),
        activity_location: newActivityLocation,
      });

    if (error) {
      console.error('Error suggesting activity:', error);
      alert('Failed to suggest activity');
      return;
    }

    setNewActivityName('');
    setNewActivityLink('');
    setNewActivityDate(new Date());
    setNewActivityLocation('');
    setSuggestedActivities([
      ...suggestedActivities,
      {
        name: newActivityName,
        activity_link: newActivityLink,
        activity_date: newActivityDate.toISOString(),
        activity_location: newActivityLocation,
      },
    ]);
    alert('Activity suggested successfully!');
  };

  // Function to send an invitation to another user
  const sendInvitation = async () => {
    const { data: invitedUser, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', inviteeEmail)
      .single();

    if (userError || !invitedUser) {
      alert('User not found');
      return;
    }

    const { data: group, error: groupError} = await supabase 
      .from('groups')
      .select('user_group_id')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (groupError || !group) {
      alert('You must be an admin to send invitations to other users');
      return;
    }

    const { error: inviteError} = await supabase
      .from('invitations')
      .insert({
        user_id: invitedUser.user_id,
        activity_id: null,
        accept: false, 
        decline: false,
      });

    if (inviteError) {
      console.error('Error sending invitation:', inviteError);
      alert('Failed to send invitation');
      return;
    }
    setInviteeEmail('');
    alert('Invitation sent successfully!');
  };

  // Function to respond to an invitation (accept or decline)
  const respondToInvitation = async (invitationId, accept) => {
    const { error } = await supabase
      .from('invitations')
      .update({
        accept: accept,
        decline: !accept,
      })
      .eq('invitation_id', invitationId);

    if (error) {
      console.error('Error responding to invitation:', error);
      alert('Failed to respond to invitation');
      return;
    }

    setInvitations(invitations.filter((inv) => inv.invitation_id !== invitationId));
    if (accept) {
      const { data: activity } = await supabase
        .from('activities')
        .select('activities (activity_id, name, activity_link, activity_date, activity_location)')
        .eq('activity_id', invitationId)
        .single();
      if (activity.activities) {
        setAcceptedActivities([
          ...acceptedActivities,
          activity.activities,
        ]);
      }
    }
  };

  // Function to create a new group
  const createGroup = async (groupName) => {
    const { error } = await supabase
      .from('groups')
      .insert({
        user_id: session.user.id,
        group_name: groupName,
        role: 'admin',
      });

    if (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
      return;
    }
     
    setGroupName(groupName);
    alert('Group created successfully!');
  };

  // Function to join an existing group
  const joinGroup = async (groupID) => {
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('user_group_id', groupID)
      .single();

    if (fetchError || !group) {
      console.error('Error fetching group:', fetchError);
      alert('Group not found');
      return;
    }

    const { error: insertError } = await supabase
      .from('groups')
      .insert({
        user_id: session.user.id,
        user_group_id: groupID,
        group_name: group.group_name,
        role: 'member',
      });

    if (insertError) {
      console.error('Error joining group:', insertError);
      alert('Failed to join group');
      return;
    }

    setGroupName(group.group_name);
    alert('Joined group successfully!');
  };

  // Function to delete the current group (admin only)
  const deleteGroup = async () => {
    const { data: group, error: groupError} = await supabase
      .from('groups')
      .select('user_group_id, role')
      .eq('user_id', session.user.id)
      .single();

    if (groupError || !group) {
      alert('Error finding group');
      return;
    }

    if (group.role !== 'admin') {
      alert('Only admins can delete groups');
      return;
    }

    const { error: activityError } = await supabase
      .from('activities')
      .delete()
      .eq('activity_owner_id', session.user.id);
    
    const { error: invitationError } = await supabase
      .from('invitations')
      .delete()
      .eq('user_id', session.user.id);

    const { error: groupDeleteError } = await supabase
      .from('groups')
      .delete()
      .eq('user_group_id', group.user_group_id);

    if (activityError || invitationError || groupDeleteError) {
      console.error('Error deleting group:', activityError || invitationError || groupDeleteError);
      alert('Failed to delete group');
      return;
    }

    setIsInGroup(false);
    alert('Group deleted successfully');
  };

  // Function to sign out the user
  async function signOut() {
    await supabase.auth.signOut();
  }

  // Render the HomeScreen UI
  return (
    <div style={{ width: '400px', margin: '30px auto'}}>
      <h2>Home Screen</h2>
      <p><strong>Group:</strong> {groupName}</p>
      <p><strong>User:</strong> {session.user.email}</p>

      <h3>Create an Event</h3>
      <p>Start of your event</p>
      <DateTimePicker onChange={setStart} value={start} />
      <p>End of your Event</p>
      <DateTimePicker onChange={setEnd} value={end} />
      <p>Event name</p>
      <input
        type="text"
        value={eventName}  
        onChange={(e) => setEventName(e.target.value)} 
      />
      <p>Event description</p>
      <input
        type="text"
        value={eventDescription} 
        onChange={(e) => setEventDescription(e.target.value)}
      />
      <button onClick={createCalendarEvent}>Create Calendar Event</button>

      <h3>List of Accepted Activities</h3>
      <ul>
        {acceptedActivities.map((activity) => (
          <li key={activity.activity_id}>
            {activity.name} - {new Date(activity.activity_date).toLocaleDateString()} at 
            {activity.activity_link && (
              <a href={activity.activity_link} target="_blank" rel="noopener noreferrer">
                (Link)
              </a>
            )}
          </li>
        ))}
      </ul>

      <h3>List of Suggested Activities</h3>
      <ul>
        {suggestedActivities.map((activity) => (
          <li key={activity.activity_id}>
            {activity.name} - {new Date(activity.activity_date).toLocaleDateString()} at {activity.activity_location}
            {activity.activity_link && (
              <a href={activity.activity_link} target="_blank" rel="noopener noreferrer">
                (Link)
              </a>
            )}
          </li>
        ))}
      </ul>

      <h3>Suggest an Activity</h3>
      <input
        type="text"
        placeholder="Activity Link (optional)"
        value={newActivityLink}
        onChange={(e) => setNewActivityLink(e.target.value)}
      />
      <button onClick={suggestActivity}>Suggest Activity</button>

      <h3>Invite a User</h3>
      <input
        type="email"
        placeholder="Invitee Email"
        value={inviteeEmail}
        onChange={(e) => setInviteeEmail(e.target.value)}
      />
      <button onClick={sendInvitation}>Send Invitation</button>

      <h3>Pending Invitations</h3>
      <ul>
        {invitations.map((invitation) => (
          <li key={invitation.invitation_id}>
            Invitation for Activity ID: {invitation.activity_id || 'Group Join'}
            <button onClick={() => respondToInvitation(invitation.invitation_id, true)}>Accept</button>
            <button onClick={() => respondToInvitation(invitation.invitation_id, false)}>Decline</button>
          </li>
        ))}
      </ul>

      <h3>Group Management</h3>
      <button onClick={() => createGroup(prompt('Enter new group name:'))}>Create New Group</button>
      <button onClick={() => joinGroup(prompt('Enter group ID to join:'))}>Join Group</button>
      <button onClick={deleteGroup}>Delete Current Group</button>

      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

// Export the HomeScreen component as the default export
export default HomeScreen;









