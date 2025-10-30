"use client";

import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Group,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value.length > 0 ? null : "Username is rqeuired"),
      password: (value) => (value.length > 0 ? null : "Password is rqeuired"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
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
    }
  };
  return (
    <Container size={420} my={40}>
      <Title> Login</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Username"
            placeholder="Your username"
            required
            {...form.getInputProps("username")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <Button fullWidth mt="xl" type="submit">
            Login
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Anchor href="/register" fw={500}>
            Don&apos;t have an account? Register
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
