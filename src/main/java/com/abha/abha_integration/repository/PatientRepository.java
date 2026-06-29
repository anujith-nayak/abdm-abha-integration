package com.abha.abha_integration.repository;

import com.abha.abha_integration.entity.Patient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByMrdNumber(String mrdNumber);

    Optional<Patient> findByAbhaAddress(String abhaAddress);

    @Query("""
            select p from Patient p
            where (:mobileNumber is not null and p.mobileNumber = :mobileNumber)
               or (:name is not null and lower(p.name) like lower(concat('%', :name, '%')))
            """)
    List<Patient> findCandidates(@Param("mobileNumber") String mobileNumber,
                                 @Param("name") String name);
}
