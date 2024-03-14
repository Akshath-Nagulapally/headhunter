"use client"

import { Button } from "@/components/ui/button"
import * as React from "react"
import { ReloadIcon } from "@radix-ui/react-icons"


import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table"


import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const api_route = "/api/url_to_contact_apollo?linkedinurl="

  const [buttonTexts, setButtonTexts] = React.useState({}) as any;  //react email state setting
  const handleButtonClick = async (rowId: any, rowDataAsString: string) => {
    setButtonTexts((prevButtonTexts: any) => ({
      ...prevButtonTexts,
      [rowId]: rowDataAsString,
    }));

    const url = `${window.location.href}${api_route}${rowDataAsString}`;

    try {
      // Make the GET request using the Fetch API
      const response = await fetch(url);
      if (!response.ok) {
        // Handle HTTP error responses
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Assuming the response is JSON
      const data = await response.json();
  
      // Log the result
      console.log(data);
    } catch (error) {
      // Handle any errors that occurred during the fetch
      console.error("Fetch error: ", error);
    }
  
  };


  



  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const [columnVisibility, setColumnVisibility] =
  React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,


    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },

  })

  return (
    <div>

    <div className="flex items-center py-4">
   {/* showing the number of selected rows*/} 
   <div className="flex-1 text-sm text-muted-foreground px-1">
      {table.getFilteredSelectedRowModel().rows.length} of{" "}
      {table.getFilteredRowModel().rows.length} row(s) selected.
    </div>


        <Input
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

    </div>

    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  // Check if the current cell belongs to the "link" column
                  if (cell.column.id === 'link') {
                    // Render the cell content as a hyperlink
                    return (
                      <TableCell key={cell.id}>
                          <a
                            href={cell.getValue() as string | undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'blue', textDecoration: 'underline' }}
                          >
                            {cell.getValue() as string | undefined}
                          </a>
                      </TableCell>
                    );
                  } else if (cell.column.id === 'getContact') {
                    // Render the cell content as a hyperlink
                    const rowData = row.original as { link?: string };
                    const rowDataAsString = rowData.link ?? '';
                  
                    return (
                      <TableCell key={cell.id}>
                    <Button 
                      variant="link" 
                      className="h-10 w-20"
                      onClick={() => handleButtonClick(row.id, rowDataAsString)} // 3. Update the state variable on click
                    >
                {buttonTexts[row.id] || "Reveal Email"}                    
                 
                 </Button>

                      </TableCell>
                    );
                  }
                  
                  else {
                    // For all other cells, use the default flexRender
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  }
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found, try asking me to be more general.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>

  )
}
