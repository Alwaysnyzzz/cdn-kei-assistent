const transactionStore = new Map();

async function saveTransaction(id, data) {
    transactionStore.set(id, data);
    return true;
}

async function getTransaction(id) {
    return transactionStore.get(id) || null;
}

async function updateTransactionStatus(id, status) {
    const tx = transactionStore.get(id);
    if (tx) {
        tx.status = status;
        transactionStore.set(id, tx);
    }
    return tx;
}

module.exports = { saveTransaction, getTransaction, updateTransactionStatus };