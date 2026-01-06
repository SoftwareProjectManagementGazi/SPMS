"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { currentUser } from "@/lib/mock-data"

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Avatar</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue={currentUser.name} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={currentUser.email} type="email" />
              </div>
            </div>

            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-muted-foreground">Receive email updates about your tasks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push notifications</p>
                <p className="text-sm text-muted-foreground">Get push notifications for task updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly digest</p>
                <p className="text-sm text-muted-foreground">Receive weekly summary of activities</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
