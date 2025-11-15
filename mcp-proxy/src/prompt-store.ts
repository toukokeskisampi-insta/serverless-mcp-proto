import { Minhash } from 'minhash';
import * as crypto from 'crypto';

export interface PromptRequest {
    key: string,
    message: string;
    result: string | null;
    errors: string[];
    similarPrompts: PromptRequest[];
}

const hashHelper = (message: string) => {
    const hash = new Minhash(message);
    const messageParts = message.split(" ");
    messageParts.map(function(w) { hash.update(w) });
    return hash;
};

class PromptStore {
    private store: PromptRequest[];

    constructor() {
        this.store = [];
    }

    public add(message: string, similarPrompts: PromptRequest[]): PromptRequest {
        const key = crypto.createHash('md5').update(message).digest('hex');

        // Return exact match
        const existingItem = this.store.find(item => item.key === key);
        if (existingItem) {
            if (existingItem.result) {
                console.log("Found", existingItem.result);
                return existingItem;
            }
        }

        const newPrompt = {
            key,
            message,
            similarPrompts,
            result: null,
            errors: []
        };
        this.store.push(newPrompt);

        return newPrompt;
    }

    public getSimilar(newMessage: string): PromptRequest[] {
        const h1 = hashHelper(newMessage);
        return this.store.filter(({message}) => {
            if (newMessage !== message) {
                const h2 = hashHelper(message);
                const similarity = h1.jaccard(h2);
                return similarity > 0.5;
            }
        });
    }

    public set(key: string, request: PromptRequest): void {
        const index = this.store.findIndex(item => item.key === key);
        if (index !== -1) {
            this.store[index] = request;
        } else {
            this.store.push(request);
        }
    }

    public get(key: string): PromptRequest | undefined {
        return this.store.find(item => item.key === key);
    }

    public has(key: string): boolean {
        return this.store.some(item => item.key === key);
    }

    public delete(key: string): boolean {
        const index = this.store.findIndex(item => item.key === key);
        if (index !== -1) {
            this.store.splice(index, 1);
            return true;
        }
        return false;
    }

    public size(): number {
        return this.store.length;
    }
}

export default PromptStore;