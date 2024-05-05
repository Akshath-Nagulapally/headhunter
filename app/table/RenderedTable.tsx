"use client";

import React, { useState, useEffect } from 'react';
import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"

interface DemoPageProps {
  prospects_data: Payment[]; // Use the Payment[] type for prospects_data
}


const DemoPage: React.FC<DemoPageProps> = ({ prospects_data }) => {
  // const [data, setData] = useState<Payment[]>([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const fetchedData = await getData();
  //     setData(fetchedData);
  //     console.log(fetchedData);
  //   };

  //   fetchData();
  // }, []); // Dependency array, re-fetch data if chatMessage changes

  return (
    <div className="container mx-auto py-10">
      
      <DataTable columns={columns} data={prospects_data} />
    </div>
  );
};







// async function getData(): Promise<Payment[]> {
//   // Your getData function remains unchanged
//   return [
//     {
//       id: "728ed52f",
//       name: "alladin",
//       link: "m@example.com",
//     },
//     // ...other data
//   ];
// }



export default DemoPage;


