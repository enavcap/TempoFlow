"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="icon"
        aria-label="Light theme"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-[1.5rem] w-[1.5rem]" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="icon"
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-[1.5rem] w-[1.5rem]" />
      </Button>
    </div>
  )
}
