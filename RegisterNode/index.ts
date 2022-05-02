import {AzureFunction, Context, HttpRequest} from "@azure/functions";
import {fromBase64, SecretNetworkClient, Tx, Wallet} from "secretjs";
import {RaAuthenticate} from "secretjs/dist/tx/registration";

// *************** ENVIRONMENT VARIABLES  ********** //

const MNEMONICS: string = process.env["MNEMONICS"] || "";
const SENDER_ADDRESS: string = process.env["SENDER_ADDRESS"] || "";

const SECRET_NODE_GRPC: string = process.env["SECRET_NODE_GRPC"] || "";
const CHAIN_ID: string = process.env["CHAIN_ID"] || "pulsar-2";

const GAS_FEE_IN_DENOM: number = Number(process.env["GAS_FEE_IN_DENOM"]) || 0.25;
const GAS_FOR_REGISTER: number = Number(process.env["GAS_FOR_REGISTER"]) || 150_000;
// *************** HELPER FUNCTIONS  ********** //

const faucet = {
    mnemonic: MNEMONICS,
    address: SENDER_ADDRESS,
};

const createSendTx = async (
    client: SecretNetworkClient,
    certificate: Uint8Array,
) => {

    let msg = new RaAuthenticate({certificate, sender: client.address});
    return await client.tx.broadcast([msg], {
        gasLimit: GAS_FOR_REGISTER,
        gasPriceInFeeDenom: GAS_FEE_IN_DENOM
    });
};

const initSecretClient = async (): Promise<SecretNetworkClient> => {
    let walletProto = new Wallet(faucet.mnemonic);

    return await SecretNetworkClient.create({
        grpcWebUrl: SECRET_NODE_GRPC,
        wallet: walletProto,
        walletAddress: faucet.address,
        chainId: CHAIN_ID,
    });
};

interface RegisterFormData {
    certificate: string;
}

interface TxResponse {
    status: string;
    details: {
        key: string;
        value: string;
    }
}

// *************** MAIN ********** //

// the user calls this function and submits his claims (permit + address)
const HttpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<TxResponse> {
    context.log('JavaScript HTTP trigger function processed a request.');

    let client = await initSecretClient();

    const params: RegisterFormData = req.body;
    let cert: Uint8Array;
    try {
        cert = fromBase64(params.certificate)
    } catch (e) {
        context.log(`failed to decode base64 certificate: ${e}`);
        context.res = {
            status: 400,
            body: {status: "failed", details: "certificate malformed"}
        }
        return;
    }

    let resp: Tx;
    try {
        resp = await createSendTx(client, cert)
    } catch (e) {
        context.log(`failed to send transaction: ${e}`);
        context.res = {
            status: 500,
            body: {status: "failed"}
        }
        return;
    }

    if (resp.code) {
        context.log(`resp ${resp.code}: ${resp.rawLog}`);

        context.res = {
            status: 500,
            body: {status: "failed", details: `${resp.rawLog}`}
        }
        return;
    }

    context.res = {
        status: 200,
        body: {
            status: "success",
            details: resp.jsonLog[0].events[0].attributes.find(attr => attr.key === "encrypted_seed")
        }
    }

    context.log(`register service ran`);

    // await cleanup();
};

export default HttpTrigger;
