/**
 * @brief Checks if the length of message is good.
 *
 * @param content (string) message to check
 * 
 * @return  An error false if not valid, else nothing
 */
export function chatTest(content: string): string | null {
    if (content.length > 1000)
        return ("Le message est trop long !");
    return (null);
}