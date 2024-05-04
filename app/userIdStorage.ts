"use server";
import { usePathname } from 'next/navigation'
 
export async function ExampleClientComponent() {
  const pathname = usePathname();
  console.log(pathname);
  return pathname;
}