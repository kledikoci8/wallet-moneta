//react custom hook file
import { useCallback } from 'react';
import { useState } from 'react';
import { Alert } from 'react-native';
import { API_URL } from '../constants/api';

//const API_URL="https://wallet-api-u1jc.onrender.com/api";
//const API_URL="http://localhost:5001/api";

export const useTransactions = (userId) => {
    const [transactions, setTransactions] = useState([]);
    const [ summary , setSummary ] = useState({ 
        balance: 0,
        income: 0,
        expense: 0 });
        const [IsLoading, setIsLoading] = useState(true);


//useCallBack is used for performance reasons it will memorize the function and will not recreate it on every render
        const fetchTransactions = useCallback(async () => {
            try {
                const response = await fetch(`${API_URL}/transactions/${userId}`);
                const data=await response.json();
                setTransactions(data);
            }
             catch (error) {
               console.error("Error fetching transactions:", error);
            } 
        }, [userId])//dependency array
    ;        
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/transactions/summary/${userId}`);
            const data=await response.json();
            setSummary(data);
        }
         catch (error) {
           console.error("Error fetching summary:", error);
        } 
    }, [userId])//dependency array
;   
    const loadData= useCallback(async () => {
        try {
        if(!userId) return;
        setIsLoading(true);
        // can run in parallel
        await Promise.all([fetchTransactions(), fetchSummary()]);
        // await fetchTransactions();
        // await fetchSummary();
        }
        catch (error) {
            console.error("Error loading data:", error);
        }
        finally {
        setIsLoading(false);}
        }, [userId, fetchTransactions, fetchSummary]);

      const deleteTransaction = async (id) => {
        try {
            const response =await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete transaction');

            //Refresh data after deletion
            loadData();
        Alert.alert("Transaction deleted successfully");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            Alert.alert("Error", error.message);
        }
    };
    return { transactions, summary, loadData, deleteTransaction, IsLoading };
} 