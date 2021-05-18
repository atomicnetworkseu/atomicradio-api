import axios from "axios";
import { AzuracastLive } from "../models/azuracast.model";

export namespace AzuracastService {

    export function getLive(): Promise<AzuracastLive> {
        return new Promise((resolve, reject) => {
            const header = { "X-API-Key": process.env.AZURACAST_TOKEN };
            axios.get("http://" + process.env.AZURACAST_API + "/api/nowplaying/5", { headers: header }).then((response) => {
                const data = response.data.live as AzuracastLive;
                resolve(data);
            });
        });
    }
}