import axios from "axios";
import fs from "fs";

class file {
	async download_zip(url_s_: string, save_path_s_: string): Promise<boolean> {
		const response = await axios({
			url: url_s_,
			method: "GET",
			responseType: "arraybuffer",
		});

		if (!response?.data) {
			return false;
		}

		fs.writeFileSync(save_path_s_, Buffer.from(response.data));
		return true;
	}
}

export default new file();
