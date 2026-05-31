import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { classesService } from "./classes.service";

export const CLASS_KEYS = {
  all: ["classes"] as const,

  detail: (id: string) => ["class", id] as const,
};

export const useClasses = () => {
  return useQuery({
    queryKey: CLASS_KEYS.all,
    queryFn: classesService.getClasses,
  });
};

export const useClassDetail = (classId: string) => {
  return useQuery({
    queryKey: CLASS_KEYS.detail(classId),
    queryFn: () => classesService.getClassById(classId),
    enabled: !!classId,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.createClass,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.all,
      });
    },
  });
};
