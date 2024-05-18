import * as SQLite from 'expo-sqlite';
import moment from 'moment';

import Transaction from '../models/transaction';

const db = SQLite.openDatabase(`transactionData${__DEV__ ? '_dev' : ''}.db`);

export const initData = () => {
    new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'create table if not exists transactionData\
                    (id integer primary key not null\
                        , stockTicker text not null\
                        , stockCount real not null\
                        , stockPrice real not null\
                        , transactionDate text not null\
                        , isBuying bit not null\
                        );\
                ',
                [],
                () => resolve(),
                (_, err) => reject(err)
            );
        });
    })
        .then(() => {
            console.log('database initialized');

            if (__DEV__) {
                populateData();
                insertTxByMessage('test');
                // insertTxByMessage('[미래에셋증권]No.8587, 전량매수, 나스닥, TSLA, 12주, USD901.10');
                // insertTxByMessage('[미래에셋증권]No.8587, 전량매도, 나스닥, TSLA, 13주, USD1001.8400');
                // insertTxByMessage('[미래에셋증권]No.8587, 전량매수, 나스닥, TSLA, 1주, USD1023.8400');
                // insertTxByMessage('[미래에셋증권]No.8587, 일부매도, 나스닥, TSLA, 3주, USD1023.24');
                // insertTxByMessage(
                //     '[Web발신]\
                //     [미래에셋증권]No.8587, 전량매수, 나스닥, TSLA, 4주, USD1004.678');
                // insertTxByMessage(
                //     '[Web발신]\
                //     [미래에셋증권]No.8587, 일부매수, 나스닥, GOOGL, 2주, USD1231.8400');
            }
        })
        .catch((err) => {
            console.log('initializing database failed');
            console.log(err);
        });
};

const populateData = async () => {
    db.transaction((tx) => {
        tx.executeSql('DELETE FROM transactionData');
    });

    // for (let i = 0; i < 20; i++) {
    //     let randomCount = parseInt(1 + Math.random() * (5 - 1));
    //     let randomPastDay = -1 * parseInt(1 + Math.random() * (7 - 1));
    //     let randomPrice = (993 + Math.random() * (1,243.49 - 930)).toFixed(2);

    //     await insertTx(new Transaction(
    //         'TSLA',
    //         randomCount,
    //         randomPrice,
    //         moment().add(randomPastDay, 'day').format('YYYY-MM-DD'),
    //         randomCount % 2 === 1));
    // }
    
    let transactions = await getAllTx();

    console.log(`popluate ${transactions.length} transactions`);
};

export const insertTxByMessage = (message) => {
    // [Web발신]
    // [미래에셋증권]No.8587, 전량매수, 나스닥, TSLA, 1주, USD1001.8400
    if (message.includes('미래에셋증권') && message.includes('TSLA')) {
      const regex = /(매수|매도).*\s(\d*)주.*\sUSD(\d*\.\d*)/gim;
      const groups = regex.exec(message);

      if (!groups || groups.length !== 4) {
        return;
      }
  
      insertTx(new Transaction(
        'TSLA',
        groups[2],
        groups[3],
        moment().format('YYYY-MM-DD'),
        groups[1] === '매수')
      )
        .then((id) => {
          console.log(`transaction(id:${id}) is inserted!`)
        })
        .catch((err) => {
          console.info(message);
          console.log(err);
        })
    }
};

export const insertTx = (model) => {
    const promise = new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'INSERT INTO transactionData (stockTicker, stockCount, stockPrice, transactionDate, isBuying)\
                    VALUES (?, ?, ?, ?, ?)',
                [model.stockTicker, model.stockCount, model.stockPrice, model.transactionDate, model.isBuying],
                (_, result) => resolve(result.insertId),
                (_, err) => reject(err)
            );
        });
    });

    return promise;
};

export const getAllTx = () => {
    const promise = new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'SELECT * FROM transactionData ORDER BY transactionDate DESC',
                [],
                (_, result) => resolve(result.rows._array),
                (_, err) => reject(err)
            );
        });
    });

    return promise;
};

export const deleteTx = (id) => {
    const promise = new Promise((resolve, reject) => {
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM transactionData WHERE id = ?',
                [id],
                (_, result) => resolve(result),
                (_, err) => reject(err)
            );
        });
    });

    return promise;
};