// Import React hook for managing state
import { useState } from 'react';
// Import Supabase hooks to manage user session and interact with the Supabase backend
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

// Define the GroupSetup component, which allows users to create or join a group
function GroupSetup({ onGroupJoined }) {
  // State for the group name when creating a new group
  const [groupName, setGroupName] = useState('');
  // State for the group ID when joining an existing group
  const [groupId, setGroupId] = useState('');
  // Get the current user session
  const session = useSession();
  // Get the Supabase client to interact with the Supabase backend
  const supabase = useSupabaseClient();

  // Function to create a new group
  const createGroup = async (groupName) => {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        user_id: session.user.id, // Use the current user's ID as the group owner
        group_name: groupName, // Set the provided group name
        role: 'admin', // Assign the creator as an admin
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error); // Log any errors that occur during group creation
      alert('Failed to create group'); // Notify the user of the failure
      return;
    }

    onGroupJoined(); // Call the callback to update the parent component's state
    alert('Group created successfully!'); // Notify the user of successful group creation
  };

  // Function to join an existing group using a group ID
  const joinGroup = async (groupId) => {
    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*') // Retrieve all columns for the specified group
      .eq('user_group_id', groupId) // Match the provided group ID
      .single();

    if (fetchError || !group) {
      console.error('Error finding group:', fetchError); // Log any errors or if the group isn't found
      alert('Group not found'); // Notify the user if the group doesn't exist
      return;
    }

    const { error: insertError } = await supabase
      .from('groups')
      .insert({
        user_id: session.user.id, // Use the current user's ID to join the group
        user_group_id: groupId, // Reference the existing group ID
        group_name: group.group_name, // Use the name of the existing group
        role: 'member', // Assign the joining user as a member
      });

    if (insertError) {
      console.error('Error joining group:', insertError); // Log any errors that occur during joining
      alert('Failed to join group'); // Notify the user of the failure
      return;
    }

    onGroupJoined(); // Call the callback to update the parent component's state
    alert('Joined group successfully!'); // Notify the user of successful joining
  };

  // Render the GroupSetup UI
  return (
    <div style={{ width: '400px', margin: '30px auto' }}>
      <h2>Welcome! Let's get you into a group.</h2>
      <div>
        <h3>Create a Group</h3>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)} // Update groupName state as the user types
        />
        <button onClick={() => createGroup(groupName)}>Create Group</button> {/* Trigger group creation with the current groupName */}
      </div>
      <div>
        <h3>Join a Group</h3>
        <input
          type="text"
          placeholder="Group ID"
          value={groupId} // Fixed typo: Value -> value
          onChange={(e) => setGroupId(e.target.value)} // Update groupId state as the user types
        />
        <button onClick={() => joinGroup(groupId)}>Join Group</button> {/* Trigger joining with the current groupId */}
      </div>
    </div>
  );
}

// Export the GroupSetup component as the default export
export default GroupSetup;