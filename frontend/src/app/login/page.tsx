"use client";

import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Button,
  Group,
  Text,
  Anchor,
} from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: isNotEmpty("Password is required"),
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: typeof form.values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });
      const raw = await response.text();
      interface LoginResponse {
        success: boolean;
        message: string;
        user?: { clinician_id: number; email: string; name: string };
      }
      let result: LoginResponse;
      try {
        result = JSON.parse(raw) as LoginResponse;
      } catch {
        throw new Error(raw?.slice(0, 300) || "Non-JSON response from server");
      }

      if (response.ok && result.success && result.user) {
        notifications.show({
          title: "Login Successful",
          message: `Welcome back, ${result.user.name}!`,
          color: "green",
        });

        login(result.user); // Update global auth state
      } else {
        notifications.show({
          title: "Login Failed",
          message: result.message,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      notifications.show({
        title: "Login Error",
        message: "Could not connect to the server. Please try again later.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <Title>Login</Title>
      <Paper
        withBorder
        shadow="md"
        p={30}
        mt={30}
        mb={80}
        radius="md"
        className="w-[420px]"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="Your email"
            withAsterisk
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            withAsterisk
            mt="sm"
            {...form.getInputProps("password")}
          />
          <Button fullWidth mt="xl" type="submit" loading={isSubmitting}>
            Login
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Text>
            Don&apos;t have an account? {""}
            <Anchor href="/register" fw={500}>
              Register
            </Anchor>
          </Text>
        </Group>
      </Paper>
    </div>
  );
}
