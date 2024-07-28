import React, { useState, useEffect } from 'react';
import { Sr25519Account } from "@unique-nft/sr25519";
import {ThinClient} from "@unique-nft/sdk";
//import { Sdk } from '@unique-nft/sdk';

// import { Web3AccountsOptions } from '@polkadot/extension-inject/types';
// import { Account } from '@unique-nft/accounts';
// import { PolkadotProvider } from '@unique-nft/accounts/polkadot';

const Polky = () => {
  const [mnemonic, setMnemonic] = useState('');
  const [firstNumber, setFirstNumber] = useState(0);
  const [secondNumber, setSecondNumber] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [sdk, setSdk] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    if (mnemonic) {
      const account = Sr25519Account.fromUri(mnemonic);
      const sdkInstance = new ThinClient({
        baseUrl: 'https://rest.unique.network/opal/v1', 
        account,
      });
      setSdk(sdkInstance);

      const fetchAccountInfo = async () => {
        try {
          const address = account.address;
          const balance = await sdkInstance.balance.get({ address });
          setAccountInfo({ address, balance });
        } catch (error) {
          console.error('Failed to fetch account information:', error);
        }
      };

      fetchAccountInfo();
    }
  }, [mnemonic]);

  const generateNewQuestion = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setFirstNumber(num1);
    setSecondNumber(num2);
  };

  const handleMnemonicSubmit = (e) => {
    e.preventDefault();
    if (mnemonic) {
      generateNewQuestion();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const correctAnswer = firstNumber + secondNumber;
    if (parseInt(userAnswer) === correctAnswer) {
      setScore(score + 1);
      setFeedback('Correct!');
      
	  if (score+1 === 10) {
		setFeedback('Correct! You earned an NFT!');
	  }
      else if ((score + 1) % 5 === 0) {
        try {
          const { parsed, error } = await sdk.collection.create.submitWaitResult({
			address: accountInfo.address,
            name: "Test collection",
            description: "My test collection",
            tokenPrefix: "TST",
			schema : {

				schemaName : 'unique',
				schemaVersion : '1.0.0',
				image : {
					urlTemplate: 'https://gateway.pinta.cloud/ipfs/{infix}'
				}, 
				coverPicture : { ifpsCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'},
				attributesSchema : {
					0: {
						name : score
					}
				}
			}
          });

          if (error) throw new Error("Error occurred while creating a collection");

          if (!parsed) throw new Error("Cannot parse results");

          const { collectionId } = parsed;

          await sdk.token.create({ collectionId });

          await sdk.token.transfer({
            collectionId,
            tokenId: 1, 
            to: accountInfo.address,
          });
          setFeedback('Correct! You earned an NFT!');
        } catch (error) {
          console.error('Failed to mint and transfer NFT:', error);
          setFeedback('Correct! But there was an error minting the NFT.');
        }
      }
    } else {
      setFeedback(`Incorrect! The correct answer was ${correctAnswer}`);
    }
    setUserAnswer('');
    generateNewQuestion();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <div className="bg-red-100 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-red-700 mb-4">PolkyMath</h1>
        {!sdk ? (
          <form onSubmit={handleMnemonicSubmit} className="flex flex-col items-center">
            <input
              type="text"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              className="p-2 border border-red-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your mnemonic key"
            />
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Input Mnemonic
            </button>
          </form>
        ) : (
          <>
            <div className="flex justify-between">
              <div>
                <div className="text-2xl mb-4">
                  <span>{firstNumber}</span> + <span>{secondNumber}</span>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="p-2 border border-red-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Your answer"
                  />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Submit
                  </button>
                </form>
                <div className="mt-4">
                  <p className="text-xl">{feedback}</p>
                  <p className="text-2xl">Score: {score}</p>
                </div>
              </div>
              {accountInfo && (
                <div className="ml-8 p-4 border border-red-300 rounded bg-red-50">
                  <h2 className="text-xl font-bold">Account Information</h2>
                  <p><strong>Address:</strong> {accountInfo.address}</p>
                  <p><strong>Balance:</strong> {accountInfo.balance?.free} UQs</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Polky;

