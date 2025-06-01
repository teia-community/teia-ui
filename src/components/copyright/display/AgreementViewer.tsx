import { useEffect, useState } from 'react';
import Button from '@atoms/button/Button';
import styles from './index.module.css';
import { fetchAgreementText } from '@data/swr';
import { HashToURL } from '@utils';

export default function AgreementViewer() {
  const [ipfsHash, setIpfsHash] = useState('');
  const [agreementText, setAgreementText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgreement = async () => {
      try {
        const ipfsUri = await fetchAgreementText();
        if (!ipfsUri) return;

        setIpfsHash(ipfsUri);

        const url = HashToURL(ipfsUri, 'IPFS');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch from IPFS');

        const json = await res.json();
        setAgreementText(json.document_text || '[No document_text found]');
      } catch (err) {
        console.error('Error loading agreement:', err);
        setAgreementText('[Error loading agreement text]');
      } finally {
        setLoading(false);
      }
    };

    loadAgreement();
  }, []);

  if (loading) return <p className={styles.loading}>Loading agreement...</p>;

  return (
    <div className={styles.agreement_box}>
      <h2 className={styles.title}>Active Copyright Agreement</h2>
      <div className={styles.agreement_text}>
        {agreementText}
      </div>
      <div className={styles.actions}>
        <Button
          as="a"
          href={HashToURL(ipfsHash, 'IPFS')}
          target="_blank"
          rel="noopener noreferrer"
          shadow_box
          fit
        >
          View on IPFS
        </Button>
      </div>
    </div>
  );
}
