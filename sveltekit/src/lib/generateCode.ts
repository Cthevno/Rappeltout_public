import { randomInt } from 'crypto';

/**
 * @brief Generates an invitation code
 * @details Made up of a word-number pair (e.g. "LUMOS-42")
 * @returns (string) The generated invitation code (e.g. "LUMOS-42")
 * @note Currently, there are 9000 possible codes
 */
export function generateCode(): string {
    const code_words = ["LUMOS", "NOX", "AVADA", "ACCIO", "REPARO", "SONORUS", "AQUA", "IMPERO", "CRUCIO"]
    const word_index = randomInt(0, code_words.length)
    const code_number = randomInt(0, 1000);
    const code = code_words[word_index] + "-" + code_number;
    return (code);
}