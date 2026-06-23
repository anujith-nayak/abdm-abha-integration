package com.abha.abha_integration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class AbhaIntegrationApplication {

	public static void main(String[] args) {
		SpringApplication.run(AbhaIntegrationApplication.class, args);
	}

}
