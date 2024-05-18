import * as React from 'react';
import { SafeAreaView, Text, Image, StyleSheet, View, RefreshControl, ScrollView } from 'react-native';
import { Title } from 'react-native-paper';

import { getStock } from '../helpers/stock';
import { getAllTx } from "../helpers/database";

export default function Home() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentPrice, setCurrentPrice] = React.useState('0');
  const [myPrice, setMyPrice] = React.useState('0');
  const quote = 'TSLA';

  const refresh = () => {
    getStock(quote)
      .then(response => response.json())
      .then(data => {
        let stockInfo = data.quoteResponse.result[0];
        //console.log(stockInfo);
        
        setCurrentPrice(stockInfo.regularMarketPrice)
      });

    let sumCount = 0;
    let sumPrice = 0;

    getAllTx().then(data => {
      //console.log(data);

      for (let i = 0; i < data.length; i++) {
        let tx = data[i];

        sumCount += (tx.isBuying ? 1 : -1) * +tx.stockCount;
        sumPrice += (tx.isBuying ? 1 : -1) * +tx.stockPrice * +tx.stockCount;
      }

      //console.log(`${sumPrice}, ${sumCount}`)
      let avgPrice = (sumPrice / sumCount);

      setMyPrice(isNaN(avgPrice) ? '' : avgPrice.toFixed(2));
    });
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, []);

  refresh();

  return (
    <SafeAreaView style={styles.container}>
       <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <Title>🚗TSLA로 테슬라 사기 대작전🚗</Title>
        <View style={styles.contentContainer}>
          <Image
            style={styles.tinyLogo}
            source={{ uri: `https://storage.googleapis.com/iex/api/logos/${quote}.png`}}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text>현재가: {currentPrice}</Text>
          <Text>평균단가: {myPrice}</Text>
          <Text>수익률: {myPrice ? ((currentPrice - myPrice) / myPrice * 100).toFixed(2) + '%' : ''}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  tinyLogo: {
    alignItems: 'center',
    width: 100,
    height: 100,
  },
});