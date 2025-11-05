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

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      name: "",
      username: "",
      password: "",
      specialty: "",
      email: "",
      phone: "",
    },
    validate: {
      name: (value) => (value.length > 0 ? null : "Name is required"),
      username: (value) => (value.length > 0 ? null : "Username is required"),
      password: (value) => {
        if (value.length === 0) {
          return "Password is required.";
        }
        return validatePassword(value)
          ? null
          : "Password must contain at least 8 characters and include uppercase, lowercase, and numbers.";
      },
    },
  });

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return !regex.test(password);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await fetch("http://localhost:8080/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        notifications.show({
          title: "Registration Successful",
          message: `Welcome back, ${result.user.username}!`,
          color: "green",
        });

        router.push("/dashboard");
      } else {
        notifications.show({
          title: "Registration Failed",
          message: result.message,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      notifications.show({
        title: "Registration Error",
        message: "Could not connect to the server. Please try again later.",
        color: "red",
      });
    }
  };
  return (
    <Container size={420} my={40}>
      <Title> Sign Up</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Name"
            placeholder="Your name"
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Username"
            placeholder="Your username"
            required
            {...form.getInputProps("username")}
            mt="md"
          />
          <TextInput
            label="Email"
            placeholder="Your Email"
            required
            mt="md"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />

          <Button fullWidth mt="xl" type="submit">
            Sign Up
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Anchor href="/login" fw={500}>
            Already have an account? Login
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
