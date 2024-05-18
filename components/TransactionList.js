import React, { useState } from 'react';
import moment from 'moment';
import { SafeAreaView, SectionList, StyleSheet, Text } from 'react-native';
import { FloatingMenu } from './common/FloatingMenu';
import { getAllTx } from "../helpers/database";

export default function TransactionList({ navigation }) {
  const [transactions, setTransactions] = useState([]);

  getAllTx().then(data => {
    let section = [];
    let date = '';

    for (let i = 0; i < data.length; i++) {
      let tx = data[i];

      if (date !== moment(tx.transactionDate, 'YYYY-MM-DD hh:mm').format('YYYY-MM-DD')) {
        date = moment(tx.transactionDate, 'YYYY-MM-DD hh:mm').format('YYYY-MM-DD');
      
        section.push({
          date: date,
          data: data.filter(t => moment(t.transactionDate, 'YYYY-MM-DD hh:mm').format('YYYY-MM-DD') == date),
        });
      }
    }

    setTransactions(section);
  });

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={transactions}
        renderItem={({item}) =>
            <Text style={styles.item}>
              <Text style={{ color: item.isBuying ? 'red' : 'blue' }}>
                {item.isBuying ? '매수' : '매도'}
              </Text> {item.stockTicker} {item.stockCount}주 USD{item.stockPrice}
            </Text>
        }
        renderSectionHeader={({ section: { date } }) => (
          <Text style={styles.header}>{date}</Text>
        )}
      />
      <FloatingMenu navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
  },
  header: {
    padding: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});