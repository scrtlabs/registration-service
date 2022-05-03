import {AzureFunction, Context, HttpRequest} from "@azure/functions";
import {fromBase64, SecretNetworkClient, Tx, Wallet} from "secretjs";
import {RaAuthenticate} from "secretjs/dist/tx/registration";

// *************** ENVIRONMENT VARIABLES  ********** //

const REGISTRATION_KEY: string = process.env["REGISTRATION_KEY"] || "MIINUzCCDPqgAwIBAgIBATAKBggqhkjOPQQDAjAUMRIwEAYDVQQDDAlTZWNyZXRURUUwHhcNMjAwOTE1MTQzNjIxWhcNMjAxMjE0MTQzNjIxWjAqMSgwJgYDVQQDDB9TZWNyZXQgTmV0d29yayBOb2RlIENlcnRpZmljYXRlMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElRADUNxVdzSyHH0QdaPUB8rA6DWxtHcxhLVNl7KmClDb6nAiYPh6opfEW2TOVBe66RWhtI+CswywuK37nOY3lqOCDCUwggwhMIIMHQYJYIZIAYb4QgENBIIMDnsicmVwb3J0IjoiZXlKcFpDSTZJakU0TmpjNU1UQTROREl5TkRjek1qRTBORFl5TURBeE56QTBOek0wTnpRNU9ERTFOek0xSWl3aWRHbHRaWE4wWVcxd0lqb2lNakF5TUMwd09TMHhOVlF4TkRvek5qb3lNUzQzTXpJME56TWlMQ0oyWlhKemFXOXVJam8wTENKaFpIWnBjMjl5ZVZWU1RDSTZJbWgwZEhCek9pOHZjMlZqZFhKcGRIa3RZMlZ1ZEdWeUxtbHVkR1ZzTG1OdmJTSXNJbUZrZG1semIzSjVTVVJ6SWpwYklrbE9WRVZNTFZOQkxUQXdNek0wSWwwc0ltbHpka1Z1WTJ4aGRtVlJkVzkwWlZOMFlYUjFjeUk2SWxOWFgwaEJVa1JGVGtsT1IxOU9SVVZFUlVRaUxDSnBjM1pGYm1Oc1lYWmxVWFZ2ZEdWQ2IyUjVJam9pUVdkQlFVRk5XVXhCUVVGTVFVRnZRVUZCUVVGQlVEaDBjWE5WVGpnemFHbEdlWFpKUzJVMFVuaFliVmd6ZHpodGNrbHZVbW96YUVwb1RXNVJZazVHZEVSM09FUkNaaXRCUW1kQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQ1VVRkJRVUZCUVVGQlFVaEJRVUZCUVVGQlFVRkNjVGMzVTNoUkswdE1Sek01TXk5R09UWnlXa3hwUWpScmJFZDRiM0JJVDFBeGRqQjFjbVZCV1RsNlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUTBWWVVFNUpSbEJTVm14alkyY3JRamt3WlZVeE5GZFVSa2xVTUZGR01YVlZSR0oyYVVoRkx6Z3ZjR2RCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVSXpPVlZ6ZUdkeU9EWmhkVUZIVW1WcFdVRlFWemRhUzNvNFQyUnVkWFJyYTJ0dloxZFhTbGxYWWtkUlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCUVVGQlFVRkJRVUZCSW4wPSIsInNpZ25hdHVyZSI6InBydjJIdkhoc3RtK2tHWmpHaGh4R0QvWkZRcFhvWFJiRlIyZXlsWG54THhBS05Eb3FCSlc4WWU4RTJ5T1FMeHlYdnJsSzFtd0t5ekh6UGcxOHJvOWhlak9xYStiT3RCa1dBenNsMGNRL0xJWU5kQVhxR0xNZmFVUjBKSS9QUU9pbkRheVBDQ3A2U0F1WWc0eWJZMTM3RkVtNVFtUG5QVFQzMVEwTXE3N1daNUV2NHdvTDkvbjcwaWJoSDNsVXVFUXo5MTNVend1S0lLaExUc0pWMHBrNE5WSGdOT1lVa0tPT1hjTmZEem55NW5hRG5VMldxZ0xSOUllU29aUG1RTU5zMTdqV2dMbVAvLzVHckpqWHZMSFhSeER6WFhubUVjK04rL1BXZVBOWGdlL2FOM3RMTWNuemJlR0ZHNHM3bnlKaG9jOTdUMGNMZU1wcG9xalVvQTI1Zz09Iiwic2lnbmluZ19jZXJ0IjoiTUlJRW9UQ0NBd21nQXdJQkFnSUpBTkVIZGwweW83Q1dNQTBHQ1NxR1NJYjNEUUVCQ3dVQU1INHhDekFKQmdOVkJBWVRBbFZUTVFzd0NRWURWUVFJREFKRFFURVVNQklHQTFVRUJ3d0xVMkZ1ZEdFZ1EyeGhjbUV4R2pBWUJnTlZCQW9NRVVsdWRHVnNJRU52Y25CdmNtRjBhVzl1TVRBd0xnWURWUVFERENkSmJuUmxiQ0JUUjFnZ1FYUjBaWE4wWVhScGIyNGdVbVZ3YjNKMElGTnBaMjVwYm1jZ1EwRXdIaGNOTVRZeE1USXlNRGt6TmpVNFdoY05Nall4TVRJd01Ea3pOalU0V2pCN01Rc3dDUVlEVlFRR0V3SlZVekVMTUFrR0ExVUVDQXdDUTBFeEZEQVNCZ05WQkFjTUMxTmhiblJoSUVOc1lYSmhNUm93R0FZRFZRUUtEQkZKYm5SbGJDQkRiM0p3YjNKaGRHbHZiakV0TUNzR0ExVUVBd3drU1c1MFpXd2dVMGRZSUVGMGRHVnpkR0YwYVc5dUlGSmxjRzl5ZENCVGFXZHVhVzVuTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFxWG90NE9adXBoUjhudWRGckFGaWFHeHhrZ21hL0VzL0JBK3RiZUNUVVIxMDZBTDFFTmNXQTRGWDNLK0U5QkJMMC83WDVyajVuSWdYL1IvMXViaGtLV3c5Z2ZxUEczS2VBdElkY3YvdVRPMXlYdjUwdnFhUHZFMUNSQ2h2emRTL1pFQnFRNW9WdkxUUFozVkVpY1FqbHl0S2dOOWNMbnhid3R1dkxVSzdleVJQZkpXL2tzZGRPelA4VkJCbmlvbFluUkNEMmpyTVJaOG5CTTJaV1l3blhud1llT0FIVitXOXRPaEFJbXdSd0tGLzk1eUFzVndkMjFyeUhNSkJjR0g3MHFMYWdaN1R0eXQrK3FPLzYrS0FYSnVLd1pxalJsRXRTRXo4Z1pRZUZmVllnY3dTZm85Nm9TTUF6VnI3VjBMNkhTRExSbnBiNnh4bWJQZHFOb2w0dFFJREFRQUJvNEdrTUlHaE1COEdBMVVkSXdRWU1CYUFGSGhEZTNhbWZyelFyMzVDTitzMWZEdUhBVkU4TUE0R0ExVWREd0VCL3dRRUF3SUd3REFNQmdOVkhSTUJBZjhFQWpBQU1HQUdBMVVkSHdSWk1GY3dWYUJUb0ZHR1QyaDBkSEE2THk5MGNuVnpkR1ZrYzJWeWRtbGpaWE11YVc1MFpXd3VZMjl0TDJOdmJuUmxiblF2UTFKTUwxTkhXQzlCZEhSbGMzUmhkR2x2YmxKbGNHOXlkRk5wWjI1cGJtZERRUzVqY213d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dHQkFHY0l0aHRjSzlJVlJ6NHJScStaS0UrN2s1MC9PeFVzbVc4YWF2T3pLYjBpQ3gwN1lROXJ6aTVuVTczdE1FMnlHUkx6aFNWaUZzL0xwRmE5bHBRTDZKTDFhUXdtRFI3NFR4WUdCQUlpNWY0STVUSm9DQ0VxUkh6OTFrcEc2VXZ5bjJ0TG1uSWRKYlBFNHZZdldMcnRYWGZGQlNTUEQ0QWZuNyszL1hVZ2dBbGM3b0NUaXpPZmJidE9GbFlBNGc1S2NZZ1MxSjJaQWVNUXFiVWRac2VaQ2NhWlpabjY1dGRxZWU4VVhabER2eDArTmRPMExSKzVwRnkranVNMHdXYnU1OU12emNtVFhianNpN0hZNnpkNTNZcTVLMjQ0ZndGSFJROGVPQjBJV0IrNFBmTTdGZUFBcFp2bGZxbEtPbExjWkwydXlWbXpSa3lSNXlXNzJ1bzltZWhYNDRDaVBKMmZzZTlZNmVRdGNmRWhNUGttSFhJMDFzTitLd1BicEEzOSt4T3NTdGpoUDlOMVkxYTJ0UUFWbyt5VmdMZ1YySHdzNzNGYzBvM3dDNzhxUEVBK3YyYVJzL0JlM1pGRGdEeWdoYy8xZmdVKzdDK1A2a2JxZDRwb3liNklXOEtDSmJ4Zk1KdmtvcmROT2dPVVV4bmRQSEVpL3RiL1U3dUxqTE9nUEE9PSJ9MAoGCCqGSM49BAMCA0cAMEQCIHlYJXyIuuFdy9KCek8GhX5Jm5s50rgImpPg8pEzJ7NiAiAR5GAtTP8kyqxGEHK5/vnuLqX/2YCYhr1e6qyaSBcuAA==";

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

interface TxResponseSuccess {
    status: string;
    details: {
        key: string;
        value: string;
    },
    registration_key: string
}

interface TxResponseFailure {
    status: string;
    details: string;
}

// *************** MAIN ********** //

// the user calls this function and submits his claims (permit + address)
const HttpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<TxResponseSuccess | TxResponseFailure> {
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
            details: resp.jsonLog[0].events[0].attributes.find(attr => attr.key === "encrypted_seed"),
            registration_key: REGISTRATION_KEY
        }
    }

    context.log(`register service ran`);

    // await cleanup();
};

export default HttpTrigger;
