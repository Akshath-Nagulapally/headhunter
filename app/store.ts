import { create } from "zustand";

type CounterStore = {
  count: string;
  update: (type: string) => void;
  // increment: () => void;
  // incrementAsync: () => Promise<void>;
  // decrement: () => void;
};

export const useCounterStore = create<CounterStore>((set) => ({
  count: 'null',
  update: (newString: string)=> {
       set((state) => ({ count: newString }));
     }
}));

export const getState = () => useCounterStore.getState();
