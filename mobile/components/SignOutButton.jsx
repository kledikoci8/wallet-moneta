import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import {  TouchableOpacity } from 'react-native'
import { styles } from '../assets/styles/home.styles'
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Alert } from 'react-native';

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()
  const handleSignOut = async () => {
    Alert.alert("Confirm Log Out", "Are you sure you want to Log Out?", [
      { text: "Cancel", style: "cancel " },
      { text: "LogOut", style:"destructive", onPress: signOut },
    ]);
  };


    /*try {
      await signOut()
      // Redirect to your desired page
      Linking.openURL(Linking.createURL('/'))
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }*/
  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
      <Ionicons name ="log-out-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  )
}