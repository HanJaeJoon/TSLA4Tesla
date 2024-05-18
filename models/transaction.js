import moment from 'moment';

class Transcation {
    constructor(stockTicker, stockCount, stockPrice, transactionDate, isBuying) {
        this.stockTicker = stockTicker;
        this.stockCount = stockCount;
        this.stockPrice = stockPrice;
        this.transactionDate = transactionDate == undefined ? moment().format('YYYY-MM-DD HH:mm') : transactionDate;
        this.isBuying = isBuying === undefined ? true : isBuying;
    }
}

export default Transcation;