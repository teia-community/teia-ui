export const TOKEN_DROP_CONTRACT_ADDRESS = 'KT1NhaMvktjR89DcdNw6gYbtW9nXnivn65uq';

export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

export const DISTRIBUTION_MAPPING_IPFS_PATH = "QmXDnvkw5ZxNQKKtNaYyve5JuCeM8PfxRM9iAZCi84JKpN";

export const MERKLE_DATA_IPFS_PATHS = {
    0: "QmR3tiFDi8vgTdvR98jS8jLn2No8EheMG6WTnpbzbupvZm",
    1: "QmWG2jqiHXFk6Ub7xY7TtjYomxern3SNXuCDVxVeFc88iA",
    2: "QmZ6P44rhTMxKHqADcW27quQPgvs6h1YTQaz1hS8J3FggF",
    3: "Qmbm99hPZBQKg5wUhzYTuQUrit5eDgvytqU8J17kpcC71T",
    4: "QmVBQjr7m25MgF2S7BkmNMtzVNfSuWCaxsYJMXkA7PNhKu",
    5: "QmTi6E5HJJGZrwKkvBRYMHx2DaVD9mij9rm5cSyDVWv64f",
    6: "QmbZsvCDiGv4xWeLtMf1wPxjogpvLjaKLwdZe5xQezUWUS",
    7: "QmbCvvyP2s6nqq1cCW9H617jRGEYoZkV3SoJHCS9sJmsNU",
    8: "QmRhr7m6zBtU1YFNcLMo34jQVUFdamG3BCGCFjA9AwBEnK"
};

export async function claimTokens() {
}

/*
// Returns the contract reference
export async function getContract(tezos, contractAddress) {
    return await tezos.wallet.at(contractAddress)
        .catch(error => console.log('Error while accessing the contract:', error));
}

// Returns the DAO token drop contract reference
export async function getDropContract() {
    if (this.state.dropContract) {
        return this.state.dropContract;
    }

    console.log('Accessing the DAO token drop contract...');
    const dropContract = await getContract(tezos, TOKEN_DROP_CONTRACT_ADDRESS);
    this.setState({ dropContract: dropContract });

    return dropContract;
}


// Claims the DAO tokens
export async function claimTokens() {
    // Get the drop contract reference
    const dropContract = await this.state.getDropContract();

    // Return if the drop contract reference is not available
    if (!dropContract) return;

    // Download the distribution file mapping file
    const mapping = await downloadFileFromIpfs(DISTRIBUTION_MAPPING_IPFS_PATH);

    // Check that the user address is included in the mapping data
    if (!(this.state.userAddress in mapping)) {
        this.state.setErrorMessage('Unfortunately you cannot claim any DAO tokens');
        return;
    }

    // Download the Merkle data
    const merkleDataPath = MERKLE_DATA_IPFS_PATHS[mapping[this.state.userAddress]];
    const merkleData = await downloadFileFromIpfs(merkleDataPath);

    // Send the claim operation
    console.log('Sending the claim operation to the token drop contract...');
    const userMerkleData = merkleData[this.state.userAddress];
    const operation = await dropContract.methods.claim(userMerkleData.proof, userMerkleData.leafDataPacked).send()
        .catch(error => console.log('Error while sending the claim operation:', error));

    // Wait for the confirmation
    await this.state.confirmOperation(operation);

    // Update the user token balance
    const storage = this.state.storage;
    const userTokenBalance = await utils.getTokenBalance(storage.token, 0, this.state.userAddress);
    this.setState({
        userTokenBalance: userTokenBalance
    });
}

// Downloads a file from ipfs
export async function downloadFileFromIpfs(ipfsPath) {
    // Download the file from IPFS
    console.log(`Downloading file from ipfs with path ${ipfsPath}...`);
    const response = await fetch(IPFS_GATEWAY + ipfsPath);

    if (!response.ok) {
        this.state.setErrorMessage(`There was a problem downloading a file from ipfs with path ${ipfsPath}`);
        return;
    }

    return await response.json();
}

*/