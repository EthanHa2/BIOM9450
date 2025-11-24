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
      first_name: "",
      last_name: "",
      password: "",
      specialty: "",
      email: "",
      phone: "",
    },
    validate: {
      first_name: isNotEmpty("First Name is required"),
      last_name: isNotEmpty("Last Name is required"),
      email: (value) => {
        if (value.length === 0) return "Email is required";
        return validateEmail(value)
          ? "Please enter a valid email address."
          : null;
      },
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
    return password.length < 8; // invalid if fewer than 8 characters
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email); // invalid if not matching basic email pattern
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost/BIOM9450_MajorProject/BIOM9450/patient-system/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });
      const raw = await response.text();
      interface RegisterResponse {
        success: boolean;
        message: string;
      }
      let result: RegisterResponse;
      try {
        result = JSON.parse(raw) as RegisterResponse;
      } catch {
        throw new Error(raw?.slice(0, 300) || "Non-JSON response from server");
      }

      if (response.ok && result.success) {
        notifications.show({
          title: "Registration Successful",
          message: result.message ?? "Registration successful! Please log in.",
          color: "green",
        });

        router.push("/login");
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
        message:
          error instanceof Error
            ? error.message
            : "Could not connect to the server. Please try again later.",
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
          <Group grow>
            <TextInput
              label="First Name"
              placeholder="First Name"
              withAsterisk
              {...form.getInputProps("first_name")}
            />
            <TextInput
              label="Last Name"
              placeholder="Last Name"
              withAsterisk
              {...form.getInputProps("last_name")}
            />
          </Group>
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
