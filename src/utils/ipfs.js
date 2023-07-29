// Downloads a file from ipfs
export async function downloadFileFromIpfs(ipfsPath) {
    const response = await fetch("https://ipfs.io/ipfs/" + ipfsPath);

    if (!response.ok) {
        console.error(`There was a problem downloading a file from ipfs with path ${ipfsPath}`);
    }

    return await response.json();
}
