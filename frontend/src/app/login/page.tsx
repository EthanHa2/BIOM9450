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
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: isNotEmpty("Username is required"),
      password: isNotEmpty("Password is required"),
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: typeof form.values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8080/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        notifications.show({
          title: "Login Successful",
          message: `Welcome back, ${result.user.username}!`,
          color: "green",
        });

        router.push("/dashboard");
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
            label="Username"
            placeholder="Your username"
            withAsterisk
            {...form.getInputProps("username")}
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
