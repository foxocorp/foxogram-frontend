<<<<<<< HEAD
import foxomoji from "foxomoji";
=======
import foxomoji from 'foxomoji';
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9

/**
 * Replaces all text emojis with image emojis from the foxomoji library.
 * @param text - The input text containing emojis.
 * @param resolution - The resolution of the emoji images (either '64' or '160').
 * @returns The text with emojis replaced by image tags.
 */
<<<<<<< HEAD
export const replaceEmojis = (text: string, resolution: "64" | "160" = "64"): string => {
=======
export const replaceEmojis = async (text: string, resolution: '64' | '160' = '64'): Promise<string> => {
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
    const emojis = foxomoji.getAllEmojis();
    let result = text;

    for (const emoji of emojis) {
        const imgTag = `<img src="/foxomoji/emoji-${resolution}/${emoji.code}.png" class="emoji" alt="${emoji.char}" draggable="false">`;
<<<<<<< HEAD
        result = result.replace(new RegExp(escapeRegExp(emoji.char), "g"), imgTag);
=======
        result = result.replace(new RegExp(escapeRegExp(emoji.char), 'g'), imgTag);
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
    }

    return result;
};

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param string - The string to escape.
 * @returns The escaped string.
 */
function escapeRegExp(string: string): string {
<<<<<<< HEAD
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
=======
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
>>>>>>> eec53638717d97f0b9ec2a017f2129589cdcd0e9
}