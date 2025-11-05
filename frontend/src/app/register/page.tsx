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
import { isNotEmpty, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      name: isNotEmpty("Name is required"),
      username: isNotEmpty("Username is required"),
      email: isNotEmpty("Email is required"),
      password: (value) => {
        if (value.length === 0) {
          return "Password is required.";
        }
        return validatePassword(value)
          ? "Password must contain at least 8 characters."
          : null;
      },
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return !regex.test(password);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
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
          message: `Welcome to (name), ${result.user.username}!`,
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
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <Title> Sign Up</Title>
      <Paper
        withBorder
        shadow="md"
        p={30}
        mt={30}
        radius="md"
        className="w-[420px]"
        mb={30}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Name"
            placeholder="Your name"
            withAsterisk
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Username"
            placeholder="Your username"
            withAsterisk
            {...form.getInputProps("username")}
            mt="sm"
          />
          <TextInput
            label="Email"
            placeholder="Your Email"
            withAsterisk
            mt="sm"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            withAsterisk
            mt="sm"
            {...form.getInputProps("password")}
          />
          <TextInput
            label="Specialty"
            placeholder="Your specialty"
            {...form.getInputProps("specialty")}
            mt="sm"
          />
          <TextInput
            label="Phone"
            placeholder="Your phone number"
            {...form.getInputProps("phone")}
            mt="sm"
          />

          <Button fullWidth mt="xl" type="submit" loading={isSubmitting}>
            Sign Up
          </Button>
        </form>
        <Group justify="center" mt="md">
          <Text>
            Already have an account? {""}
            <Anchor href="/login" fw={500}>
              Login
            </Anchor>
          </Text>
        </Group>
      </Paper>
    </div>
  );
}
