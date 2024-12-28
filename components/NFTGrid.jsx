import React from 'react';

const NFTGrid = ({ nfts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {nfts.map((nft) => (
        <div 
          key={nft.nft_id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Image */}
          <div className="aspect-square relative">
            <img
              src={nft.image_url || nft.previews?.image_medium_url}
              alt={nft.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* NFT Info */}
          <div className="p-4">
            <h3 className="font-bold text-lg truncate">{nft.name}</h3>
            
            {/* Collection Name */}
            {nft.collection?.name && (
              <p className="text-sm text-gray-600 truncate">
                Collection: {nft.collection.name}
              </p>
            )}

            {/* Attributes */}
            {nft.extra_metadata?.attributes && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {nft.extra_metadata.attributes.map((attr, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 rounded-full px-2 py-1"
                    >
                      {attr.trait_type}: {attr.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External Link */}
            {nft.external_url && (
              <a
                href={nft.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGrid; 