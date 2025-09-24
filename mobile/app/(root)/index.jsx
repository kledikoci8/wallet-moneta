import {  useUser } from '@clerk/clerk-expo'
import {  useRouter } from 'expo-router'
import { FlatList, Text,  TouchableOpacity, View } from 'react-native'
import { SignOutButton } from '@/components/SignOutButton'
import { useEffect} from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import PageLoader from '../../components/PageLoader'
import { styles } from '../../assets/styles/home.styles'
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BalanceCard } from '../../components/BalanceCard'
import { TransactionItem } from '../../components/TransactionItem'
import { Alert } from 'react-native'
import NoTransactionsFound from '../../components/NoTransactionsFound'
import { RefreshControl } from 'react-native'
import { useState } from 'react'


export default function Page() {
  const { user } = useUser()
  const router= useRouter();
  const [refreshing, setRefreshing] = useState(false);
   const { transactions, summary, loadData, deleteTransaction, IsLoading } = useTransactions(user.id);

const onRefresh =async() => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
}

 
   useEffect(() => {
      loadData();
    }, [loadData]);



   const handleDelete = (id) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) }
    ]
    );
   }



    if (IsLoading && !refreshing)  return  <PageLoader />
      
 

    // Flatlist is a performant way to render long lists in React Native
    //it renders items lazily - only those on the screen 
   return (
    <View style={styles.container }>
      <View style={styles.content}>
          <View style={styles.header}>

            <View style={styles.headerLeft}>
            <Image
            source={require('../../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.usernameText}>
              {user?.emailAddresses[0]?.emailAddress.split('@')[0]}
            </Text>
          </View>
         </View>

                <View style={styles.headerRight}>
                 <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                 <Text style={styles.addButtonText}>Add</Text>
                 </TouchableOpacity>
                 <SignOutButton />
                </View>
          </View>
        
          <BalanceCard summary={summary} />


       
       
        </View>
     


         <FlatList
         style={styles.transactionsList}
         contentContainerStyle={styles.transactionsListContent}
         data ={transactions}
         renderItem = {({item}) => 
          <TransactionItem item={item}  onDelete={handleDelete} />}
         ListEmptyComponent={<NoTransactionsFound />}
         showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={refreshing}  onRefresh={onRefresh} /> }

         />
     

      </View>
    
  );
}