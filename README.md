# Secret Network Node Registration Service

An Azure Functions service for registering Secret Network nodes using remote attestation certificates.

## Overview

This service provides a secure HTTP endpoint for registering Secret Network nodes by validating and processing remote attestation certificates. The service interacts with the Secret Network blockchain using the SecretJS library to authenticate nodes via the RA (Remote Attestation) authentication mechanism.

## Architecture

- **Platform**: Azure Functions (TypeScript)
- **Framework**: Azure Functions v4
- **Blockchain**: Secret Network
- **Language**: TypeScript
- **Dependencies**: SecretJS for blockchain interaction

## API Endpoint

### POST `/api/RegisterNode`

Registers a Secret Network node using a remote attestation certificate.

#### Request Body
```json
{
  "certificate": "base64-encoded-certificate"
}
```

#### Response (Success)
```json
{
  "status": "success",
  "details": {
    "key": "encrypted_seed",
    "value": "encrypted-seed-value"
  },
  "registration_key": "registration-key-value"
}
```

#### Response (Error)
```json
{
  "status": "failed",
  "details": "error-description"
}
```

#### HTTP Status Codes
- `200` - Successful registration
- `400` - Malformed certificate
- `500` - Internal server error or blockchain transaction failure

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REGISTRATION_KEY` | Node registration key certificate | No (has default) |
| `MNEMONICS` | Wallet mnemonic for transaction signing | Yes |
| `SENDER_ADDRESS` | Address of the transaction sender | Yes |
| `SECRET_NODE_LCD` | Secret Network LCD endpoint URL | Yes |
| `CHAIN_ID` | Secret Network chain ID | No (default: "pulsar-3") |
| `GAS_FEE_IN_DENOM` | Gas fee amount | No (default: 0.25) |
| `GAS_FOR_REGISTER` | Gas limit for registration | No (default: 150,000) |

## Development

### Prerequisites
- Node.js 18+
- Azure Functions Core Tools
- Azure account and subscription

### Installation
```bash
npm install
```

### Local Development
```bash
# Build and watch for changes
npm run watch

# Start local development server
npm start
```

### Building
```bash
# Development build
npm run build

# Production build
npm run build:production
```

### Deployment

#### Testnet
```bash
npm run deploy:testnet
```

#### Mainnet
```bash
npm run deploy:mainnet
```

## Project Structure

```
registration-service/
├── src/
│   └── functions/
│       └── RegisterNode.ts    # Main registration function
├── host.json                  # Azure Functions configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Security Considerations

- Certificates are validated and decoded from base64
- All transactions are signed using the configured wallet
- Environment variables contain sensitive information (mnemonics, keys)
- The service uses HTTPS endpoints for blockchain communication

## Error Handling

The service includes comprehensive error handling for:
- Malformed certificate data
- Base64 decoding failures
- Blockchain transaction failures
- Network connectivity issues

## Dependencies

- `@azure/functions` - Azure Functions runtime
- `secretjs` - Secret Network JavaScript SDK
- `@types/node` - TypeScript definitions for Node.js

## License

[Add your license information here]